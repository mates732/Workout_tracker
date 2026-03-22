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


@router.post("")
def create_workout(payload: CreateWorkoutRequest, _: str = Depends(require_bearer_token)) -> dict:
    return _controller.create(payload.user_id, payload.name)
