from services.workout_service import WorkoutService


def test_workout_creation_and_set_tracking() -> None:
    service = WorkoutService()
    workout = service.create_workout("u1", "Push Day")
    assert workout.name == "Push Day"

    updated = service.add_set("u1", 0, weight_kg=80, reps=8, rpe=8)
    assert updated.total_volume == 640
