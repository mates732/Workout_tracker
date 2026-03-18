from vpulz_platform.backend.core.container import container
from vpulz_platform.backend.models.exercise_entities import CreateUserExercisePayload, SearchFilters


def setup_function() -> None:
    container.exercise_repo.exercises.clear()
    container.exercise_repo.ai_metadata.clear()
    container.exercise_repo.recent_by_user.clear()
    container.exercise_repo.favorites_by_user.clear()


def test_search_returns_seeded_results() -> None:
    results = container.exercise_service.search_exercises(SearchFilters(user_id="u1", query="bench", limit=10))
    assert results
    assert any(item["name"] == "Bench Press" for item in results)


def test_create_user_exercise_enriches_with_ai_metadata() -> None:
    created = container.exercise_service.create_user_exercise(
        CreateUserExercisePayload(
            user_id="u1",
            name="Incline Dumbbell Press",
            primary_muscle="chest",
            equipment="dumbbell",
            movement_pattern="push",
            notes="custom variation",
        )
    )

    assert created["exercise"]["source_type"] == "user"
    assert created["ai_metadata"]["fatigue_score"] >= 1
    assert created["exercise"]["difficulty_level"] in {"beginner", "intermediate", "advanced"}


def test_duplicate_detection_returns_similar_candidates() -> None:
    container.exercise_service.create_user_exercise(
        CreateUserExercisePayload(
            user_id="u2",
            name="Flat Bench Press",
            primary_muscle="chest",
            equipment="barbell",
            movement_pattern="push",
            notes="",
        )
    )

    suggestions = container.exercise_service.duplicate_check(
        user_id="u2",
        name="Bench Press",
        primary_muscle="chest",
        equipment="barbell",
        movement_pattern="push",
    )

    assert suggestions
    assert suggestions[0]["score"] >= 0.62


def test_favorites_affect_search_ranking() -> None:
    seeded = container.exercise_service.search_exercises(SearchFilters(user_id="u3", query="", limit=10))
    bench = next(item for item in seeded if item["name"] == "Bench Press")

    favorite_on = container.exercise_service.toggle_favorite("u3", bench["id"])
    assert favorite_on["is_favorite"] is True

    favorites_only = container.exercise_service.search_exercises(
        SearchFilters(user_id="u3", query="", only_favorites=True, include_recent=False, limit=10)
    )
    assert len(favorites_only) == 1
    assert favorites_only[0]["id"] == bench["id"]
