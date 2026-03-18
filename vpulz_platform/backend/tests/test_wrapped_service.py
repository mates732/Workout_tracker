from datetime import datetime, timedelta

from vpulz_platform.backend.models.entities import SetEntry, Workout, WorkoutExercise
from vpulz_platform.backend.services.wrapped_service import WrappedService


def _w(days_ago: int, exercise: str, sets: list[tuple[float, int, float]]) -> Workout:
    return Workout(
        workout_id=f"w-{days_ago}-{exercise}",
        user_id="u1",
        started_at=datetime.utcnow() - timedelta(days=days_ago),
        exercises=[
            WorkoutExercise(
                exercise_name=exercise,
                sets=[
                    SetEntry(weight=kg, reps=reps, rpe=rpe, notes="", timestamp=datetime.utcnow() - timedelta(days=days_ago))
                    for kg, reps, rpe in sets
                ],
            )
        ],
    )


def test_generate_wrapped_monthly_metrics_and_slides() -> None:
    workouts = [
        _w(2, "Bench Press", [(100, 5, 8.5), (105, 3, 9.0)]),
        _w(5, "Bench Press", [(95, 8, 8.0)]),
        _w(7, "Squat", [(140, 3, 9.5)]),
    ]
    service = WrappedService()

    wrapped = service.generate_wrapped(workouts, "monthly")

    assert wrapped["metrics"]["sessions"] == 3
    assert wrapped["metrics"]["dominant_exercise"] == "Bench Press"
    assert wrapped["metrics"]["total_volume"] > 0
    assert len(wrapped["slides"]) == 6
    assert wrapped["ai_commentary"]


def test_generate_wrapped_empty_history() -> None:
    service = WrappedService()
    wrapped = service.generate_wrapped([], "weekly")

    assert wrapped["metrics"]["sessions"] == 0
    assert wrapped["metrics"]["biggest_lift"] == "n/a"
    assert "unlock your first VPULZ Wrapped" in wrapped["ai_commentary"][0]
