from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.repositories.memory_repo import WorkoutRepository
from backend.schemas.api import AddExerciseRequest, LogSetRequest, StartWorkoutRequest
from backend.services.workout_logging import WorkoutLoggingService

router = APIRouter(prefix="/workouts", tags=["workouts"])
repo = WorkoutRepository()
service = WorkoutLoggingService(repo)


@router.post("/start")
def start_workout(payload: StartWorkoutRequest) -> dict:
    workout = service.start_workout(payload.user_id)
    return {"workout_id": workout.workout_id, "started_at": workout.started_at.isoformat()}


@router.post("/{workout_id}/exercise")
def add_exercise(workout_id: str, payload: AddExerciseRequest) -> dict:
    try:
        workout = service.add_exercise(workout_id, payload.name)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Workout not found") from exc
    return {"workout_id": workout.workout_id, "exercise_count": len(workout.exercises)}


@router.post("/{workout_id}/set")
def log_set(workout_id: str, payload: LogSetRequest) -> dict:
    try:
        workout = service.log_set(workout_id, payload.exercise_name, payload.weight, payload.reps, payload.rpe, payload.notes)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Workout not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"workout_id": workout.workout_id, "total_volume": workout.total_volume}


@router.post("/{workout_id}/finish")
def finish_workout(workout_id: str) -> dict:
    try:
        workout = service.finish_workout(workout_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Workout not found") from exc
    return {"workout_id": workout.workout_id, "finished_at": workout.finished_at.isoformat() if workout.finished_at else None}
