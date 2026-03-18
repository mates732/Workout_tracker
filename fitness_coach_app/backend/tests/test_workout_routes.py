from __future__ import annotations

from pathlib import Path

from controllers.workout_controller import WorkoutController
from core.database import Base, create_database_engine, create_session_factory
from models.exercise_db import ExerciseDB
from repositories.workout_repository import WorkoutRepository
from services.workout_service import WorkoutService


def _controller(tmp_path: Path) -> WorkoutController:
    engine = create_database_engine(f"sqlite:///{tmp_path / 'controller.db'}")
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
    return WorkoutController(service)


def test_controller_happy_path(tmp_path: Path) -> None:
    controller = _controller(tmp_path)
    started = controller.start_workout_session("api-u1")
    workout_id = started["workout"]["id"]

    added = controller.add_exercise_to_workout(workout_id, None, "Bench Press")
    assert added["exercise"]["name"] == "Bench Press"

    logged = controller.log_set(
        workout_id=workout_id,
        weight=90,
        reps=6,
        rpe=8.5,
        duration=90,
        completed=True,
        workout_exercise_id=None,
        exercise_id=None,
        exercise_name="Bench Press",
    )
    assert logged["set"]["volume"] == 540
    assert "suggestion" in logged
    assert "feedback" in logged


def test_controller_returns_400_for_invalid_set_payload(tmp_path: Path) -> None:
    controller = _controller(tmp_path)
    started = controller.start_workout_session("api-u2")
    workout_id = started["workout"]["id"]

    try:
        controller.log_set(
            workout_id=workout_id,
            weight=-1,
            reps=5,
            rpe=8,
            duration=90,
            completed=True,
            workout_exercise_id=None,
            exercise_id=None,
            exercise_name="Bench Press",
        )
        raise AssertionError("Expected HTTPException")
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 400

