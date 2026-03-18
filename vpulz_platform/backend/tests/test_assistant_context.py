from vpulz_platform.backend.ai.context_builder import build_context
from vpulz_platform.backend.core.container import container
from vpulz_platform.backend.models.entities import AssistantContextSnapshot, UserProfile


def setup_function() -> None:
    container.workout_repo.store.clear()
    container.routine_repo.store.clear()
    container.profile_repo.store.clear()


def test_assistant_context_includes_profile_constraints_and_active_training() -> None:
    profile = UserProfile(
        user_id="u-profile",
        goal="hypertrophy",
        level="intermediate",
        equipment=["dumbbell", "cable"],
        injuries=["left shoulder"],
        limitations=["avoid heavy overhead pressing"],
        preferred_split="upper-lower",
        notes="sleep has been poor this week",
    )
    container.profile_service.update_profile(profile)

    workout = container.workout_service.start_workout("u-profile")
    container.workout_service.add_exercise(workout.workout_id, "Cable Row")
    container.workout_service.log_set(workout.workout_id, "Cable Row", 55, 12, 8.0, "clean reps")

    snapshot = AssistantContextSnapshot(
        profile=profile,
        fatigue_score=22.5,
        active_workout_id=workout.workout_id,
        active_workout_exercises=["Cable Row"],
        recent_workout_count=1,
        routine_count=0,
        estimated_1rm=77.0,
        total_volume=660.0,
        consistency_score=4.0,
        strength_score=183,
        response_profile="balanced_adaptation",
        training_timeline=["2026 - training journey started"],
        recent_exercises=["Cable Row"],
    )

    context = build_context(profile, [workout], [], 22.5, snapshot=snapshot)

    assert "left shoulder" in context
    assert "avoid heavy overhead pressing" in context
    assert workout.workout_id in context
    assert "Cable Row" in context
    assert "balanced_adaptation" in context
