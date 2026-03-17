from controllers.workout_controller import WorkoutController
from services.workout_service import WorkoutService


def test_controller_end_to_end_workout_flow() -> None:
    controller = WorkoutController(WorkoutService())

    created = controller.create("api-u1", "Upper Day")
    assert created["workout_index"] == 0

    exercise = controller.add_exercise("api-u1", 0, "Bench Press", "chest", "barbell", "")
    assert exercise["name"] == "Bench Press"

    updated = controller.add_set("api-u1", 0, "Bench Press", 90, 6, 8.5, 120, "Paused reps")
    assert updated["total_sets"] == 1

    summary = controller.summary("api-u1", 0)
    assert summary["total_volume"] == 540
    assert summary["exercises"][0]["target_muscle"] == "chest"

    listed = controller.list_user_workouts("api-u1")
    assert listed["count"] == 1


def test_controller_returns_400_for_bad_payload() -> None:
    controller = WorkoutController(WorkoutService())
    controller.create("api-u2", "Lower Day")

    try:
        controller.add_set("api-u2", 0, "Squat", 100, 5, 8, -1, "")
        raise AssertionError("Expected error")
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 400
