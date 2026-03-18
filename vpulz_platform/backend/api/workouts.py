from __future__ import annotations

from fastapi import APIRouter, HTTPException

from vpulz_platform.backend.core.container import container
from vpulz_platform.backend.schemas.api import AddExerciseRequest, EditSetRequest, LogSetRequest, StartWorkoutRequest

router = APIRouter(prefix="/workouts", tags=["workouts"])


def _serialize_workout(workout) -> dict:
    return {
        "workout_id": workout.workout_id,
        "user_id": workout.user_id,
        "started_at": workout.started_at.isoformat(),
        "ended_at": workout.ended_at.isoformat() if workout.ended_at else None,
        "total_volume": workout.total_volume,
        "exercises": [
            {
                "exercise_name": exercise.exercise_name,
                "sets": [
                    {
                        "weight": logged_set.weight,
                        "reps": logged_set.reps,
                        "rpe": logged_set.rpe,
                        "notes": logged_set.notes,
                        "timestamp": logged_set.timestamp.isoformat(),
                    }
                    for logged_set in exercise.sets
                ],
            }
            for exercise in workout.exercises
        ],
    }


@router.post("/start")
def start_workout(payload: StartWorkoutRequest) -> dict:
    workout = container.workout_service.start_workout(payload.user_id)
    return {"workout_id": workout.workout_id, "started_at": workout.started_at.isoformat()}


@router.post("/{workout_id}/exercise")
def add_exercise(workout_id: str, payload: AddExerciseRequest) -> dict:
    try:
        workout = container.workout_service.add_exercise(workout_id, payload.exercise_name)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Workout not found") from exc
    return {"exercise_count": len(workout.exercises)}


@router.post("/{workout_id}/set")
def log_set(workout_id: str, payload: LogSetRequest) -> dict:
    try:
        workout = container.workout_service.log_set(workout_id, payload.exercise_name, payload.weight, payload.reps, payload.rpe, payload.notes)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Workout not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    feedback = container.recommendations.realtime_companion_feedback(
        next(ex.sets[-1] for ex in workout.exercises if ex.exercise_name == payload.exercise_name),
        payload.reps,
    )
    return {"total_volume": workout.total_volume, "companion_feedback": feedback}


@router.patch("/{workout_id}/set")
def edit_set(workout_id: str, payload: EditSetRequest) -> dict:
    try:
        workout = container.workout_service.edit_set(workout_id, payload.exercise_name, payload.set_index, payload.weight, payload.reps, payload.rpe, payload.notes)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Workout not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"total_volume": workout.total_volume}


@router.post("/{workout_id}/finish")
def finish_workout(workout_id: str) -> dict:
    try:
        workout = container.workout_service.finish_workout(workout_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Workout not found") from exc
    return {"workout_id": workout.workout_id, "finished": workout.ended_at is not None}


@router.get("/active/{user_id}")
def active_workout(user_id: str) -> dict:
    workout = container.workout_repo.active_by_user(user_id)
    if workout is None:
        return {"workout": None}
    return {"workout": _serialize_workout(workout)}


@router.get("/history/{user_id}")
def workout_history(user_id: str) -> dict:
    workouts = sorted(container.workout_repo.by_user(user_id), key=lambda workout: workout.started_at, reverse=True)
    return {"items": [_serialize_workout(workout) for workout in workouts]}
