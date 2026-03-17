from services.workout_service import WorkoutService


def test_workout_creation_and_set_tracking() -> None:
    service = WorkoutService()
    workout = service.create_workout("u1", "Push Day")
    assert workout.name == "Push Day"

    service.add_exercise("u1", 0, "Bench Press", target_muscle="chest", equipment="barbell")
    updated = service.add_set("u1", 0, weight_kg=80, reps=8, rpe=8, exercise_name="Bench Press", notes="Strong")

    assert updated.total_sets == 1
    assert updated.total_volume == 640
    bench = updated.get_exercise("Bench Press")
    assert bench is not None
    assert bench.target_muscle == "chest"
    assert bench.sets[0].notes == "Strong"


def test_summary_groups_sets_by_exercise_with_info() -> None:
    service = WorkoutService()
    service.create_workout("u2", "Pull Day")
    service.add_exercise("u2", 0, "Deadlift", target_muscle="back", equipment="barbell")
    service.add_set("u2", 0, weight_kg=120, reps=5, rpe=8.5, exercise_name="Deadlift")
    service.add_set("u2", 0, weight_kg=125, reps=3, rpe=9, exercise_name="Deadlift")
    service.add_set("u2", 0, weight_kg=70, reps=10, rpe=8, exercise_name="Barbell Row")

    summary = service.get_workout_summary("u2", 0)
    assert summary["total_sets"] == 3
    assert summary["total_volume"] == 1675
    assert len(summary["exercises"]) == 2

    deadlift_summary = next(item for item in summary["exercises"] if item["name"] == "Deadlift")
    assert deadlift_summary["target_muscle"] == "back"
    assert deadlift_summary["sets"] == 2


def test_add_set_rejects_invalid_rest() -> None:
    service = WorkoutService()
    service.create_workout("u3", "Leg Day")

    try:
        service.add_set("u3", 0, weight_kg=100, reps=5, rpe=8, rest_seconds=-10)
        raise AssertionError("Expected ValueError for invalid rest_seconds")
    except ValueError as exc:
        assert "rest_seconds" in str(exc)
