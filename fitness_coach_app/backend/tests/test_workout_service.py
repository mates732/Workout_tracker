from __future__ import annotations

from pathlib import Path

from core.database import Base, create_database_engine, create_session_factory
from models.exercise_db import ExerciseDB
from repositories.workout_repository import WorkoutRepository
from services.workout_service import WorkoutService


def _service(tmp_path: Path) -> WorkoutService:
    engine = create_database_engine(f"sqlite:///{tmp_path / 'service.db'}")
    session_factory = create_session_factory(engine)
    Base.metadata.create_all(bind=engine)
    service = WorkoutService(session_factory=session_factory, repository=WorkoutRepository())

    with session_factory.begin() as session:
        session.add(
            ExerciseDB(
                name="Bench Press",
                muscle_group="chest",
                equipment="barbell",
                instructions="Press barbell from chest.",
            )
        )
    return service


def test_workout_service_session_lifecycle_and_logging(tmp_path: Path) -> None:
    service = _service(tmp_path)
    first = service.start_session("u1")
    second = service.start_session("u1")

    assert first["resumed"] is False
    assert second["resumed"] is True
    workout_id = second["workout"]["id"]

    added = service.add_exercise_to_workout(workout_id=workout_id, exercise_name="Bench Press")
    assert added["exercise"]["name"] == "Bench Press"

    logged = service.log_set(
        workout_id=workout_id,
        weight=100,
        reps=5,
        rpe=8.5,
        exercise_name="Bench Press",
    )
    assert logged["set"]["volume"] == 500
    assert "suggestion" in logged
    assert logged["suggestion"]["next_weight_kg"] == 102.5

    finished = service.finish_session(workout_id)
    assert finished["workout"]["status"] == "finished"
    assert finished["workout"]["end_time"] is not None


def test_workout_service_progress_tracking(tmp_path: Path) -> None:
    service = _service(tmp_path)
    started = service.start_session("u2")
    workout_id = started["workout"]["id"]
    service.log_set(workout_id=workout_id, weight=100, reps=5, rpe=8.5, exercise_name="Bench Press")
    service.finish_session(workout_id)

    started_next = service.start_session("u2")
    next_workout_id = started_next["workout"]["id"]
    service.log_set(workout_id=next_workout_id, weight=102.5, reps=6, rpe=8.5, exercise_name="Bench Press")

    state = service.get_workout_state(next_workout_id)
    exercise_id = state["workout"]["exercises"][0]["exercise_id"]
    progress = service.get_progress(exercise_id=exercise_id, user_id="u2")

    assert progress["exercise_name"] == "Bench Press"
    assert [item["weight"] for item in progress["weight_over_time"]] == [100.0, 102.5]
    assert len(progress["volume_trend"]) == 2

