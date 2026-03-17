from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from controllers.workout_controller import WorkoutController
from middleware.auth import require_bearer_token
from services.workout_service import WorkoutService

router = APIRouter(prefix="/workouts", tags=["workouts"])
_service = WorkoutService()
_controller = WorkoutController(_service)


class CreateWorkoutRequest(BaseModel):
    user_id: str
    name: str = Field(min_length=2)


class AddExerciseRequest(BaseModel):
    user_id: str
    workout_index: int = Field(ge=0)
    exercise_name: str = Field(min_length=1)
    target_muscle: str = ""
    equipment: str = ""
    notes: str = ""


class AddSetRequest(BaseModel):
    user_id: str
    workout_index: int = Field(ge=0)
    exercise_name: str = Field(min_length=1)
    weight_kg: float = Field(gt=0)
    reps: int = Field(gt=0)
    rpe: float = Field(ge=1, le=10)
    rest_seconds: int = Field(default=90, ge=0)
    notes: str = ""


@router.post("")
def create_workout(payload: CreateWorkoutRequest, _: str = Depends(require_bearer_token)) -> dict:
    return _controller.create(payload.user_id, payload.name)


@router.post("/exercise")
def add_exercise(payload: AddExerciseRequest, _: str = Depends(require_bearer_token)) -> dict:
    return _controller.add_exercise(
        payload.user_id,
        payload.workout_index,
        payload.exercise_name,
        payload.target_muscle,
        payload.equipment,
        payload.notes,
    )


@router.post("/set")
def add_set(payload: AddSetRequest, _: str = Depends(require_bearer_token)) -> dict:
    return _controller.add_set(
        payload.user_id,
        payload.workout_index,
        payload.exercise_name,
        payload.weight_kg,
        payload.reps,
        payload.rpe,
        payload.rest_seconds,
        payload.notes,
    )


@router.get("/{user_id}")
def list_workouts(user_id: str, _: str = Depends(require_bearer_token)) -> dict:
    return _controller.list_user_workouts(user_id)


@router.get("/{user_id}/{workout_index}/summary")
def workout_summary(user_id: str, workout_index: int, _: str = Depends(require_bearer_token)) -> dict:
    return _controller.summary(user_id, workout_index)
