from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field, model_validator

from controllers.workout_controller import WorkoutController
from core.database import SessionLocal
from middleware.auth import require_bearer_token
from repositories.workout_repository import WorkoutRepository
from services.workout_service import WorkoutService

session_router = APIRouter(prefix="/workout", tags=["workout"])
exercise_router = APIRouter(prefix="/exercises", tags=["exercises"])
set_router = APIRouter(tags=["sets"])
progress_router = APIRouter(prefix="/progress", tags=["progress"])
legacy_router = APIRouter(prefix="/workouts", tags=["workouts-legacy"])

_repository = WorkoutRepository()
_service = WorkoutService(session_factory=SessionLocal, repository=_repository)
_controller = WorkoutController(_service)


class StartWorkoutSessionRequest(BaseModel):
    user_id: str = Field(min_length=1)


class AddWorkoutExerciseRequest(BaseModel):
    exercise_id: int | None = Field(default=None, gt=0)
    exercise_name: str | None = Field(default=None, min_length=1)

    @model_validator(mode="after")
    def validate_identifier(self) -> "AddWorkoutExerciseRequest":
        if self.exercise_id is None and not self.exercise_name:
            raise ValueError("exercise_id or exercise_name is required")
        return self


class SetLogRequest(BaseModel):
    workout_id: str = Field(min_length=1)
    weight: float = Field(gt=0)
    reps: int = Field(gt=0)
    rpe: float = Field(ge=1, le=10)
    duration: int = Field(default=90, ge=0)
    completed: bool = True
    workout_exercise_id: str | None = None
    exercise_id: int | None = Field(default=None, gt=0)
    exercise_name: str | None = Field(default=None, min_length=1)

    @model_validator(mode="after")
    def validate_exercise_identifier(self) -> "SetLogRequest":
        if self.workout_exercise_id:
            return self
        if self.exercise_id is None and not self.exercise_name:
            raise ValueError("workout_exercise_id or exercise_id or exercise_name is required")
        return self


class SetPatchRequest(BaseModel):
    weight: float | None = Field(default=None, gt=0)
    reps: int | None = Field(default=None, gt=0)
    rpe: float | None = Field(default=None, ge=1, le=10)
    duration: int | None = Field(default=None, ge=0)
    completed: bool | None = None


@session_router.post("/start")
def start_workout_session(payload: StartWorkoutSessionRequest, _: str = Depends(require_bearer_token)) -> dict:
    return _controller.start_workout_session(payload.user_id)


@session_router.post("/{workout_id}/finish")
def finish_workout_session(workout_id: str, _: str = Depends(require_bearer_token)) -> dict:
    return _controller.finish_workout_session(workout_id)


@session_router.get("/active")
def active_workout_session(user_id: str = Query(min_length=1), _: str = Depends(require_bearer_token)) -> dict:
    return _controller.active_workout_session(user_id)


@session_router.get("/{workout_id}")
def get_workout_state(workout_id: str, _: str = Depends(require_bearer_token)) -> dict:
    return _controller.get_workout_state(workout_id)


@session_router.post("/{workout_id}/exercise")
def add_exercise_to_workout(
    workout_id: str,
    payload: AddWorkoutExerciseRequest,
    _: str = Depends(require_bearer_token),
) -> dict:
    return _controller.add_exercise_to_workout(
        workout_id=workout_id,
        exercise_id=payload.exercise_id,
        exercise_name=payload.exercise_name,
    )


@exercise_router.get("")
def search_exercises(
    query: str | None = Query(default=None),
    muscle_group: str | None = Query(default=None),
    limit: int = Query(default=30, ge=1, le=200),
    _: str = Depends(require_bearer_token),
) -> dict:
    return _controller.search_exercises(query=query, muscle_group=muscle_group, limit=limit)


@set_router.post("/set")
def log_set(payload: SetLogRequest, _: str = Depends(require_bearer_token)) -> dict:
    return _controller.log_set(
        workout_id=payload.workout_id,
        weight=payload.weight,
        reps=payload.reps,
        rpe=payload.rpe,
        duration=payload.duration,
        completed=payload.completed,
        workout_exercise_id=payload.workout_exercise_id,
        exercise_id=payload.exercise_id,
        exercise_name=payload.exercise_name,
    )


@set_router.patch("/set/{set_id}")
def update_set(set_id: str, payload: SetPatchRequest, _: str = Depends(require_bearer_token)) -> dict:
    return _controller.update_set(
        set_id=set_id,
        weight=payload.weight,
        reps=payload.reps,
        rpe=payload.rpe,
        duration=payload.duration,
        completed=payload.completed,
    )


@progress_router.get("/{exercise_id}")
def get_progress(exercise_id: int, user_id: str | None = Query(default=None), _: str = Depends(require_bearer_token)) -> dict:
    return _controller.get_exercise_progress(exercise_id, user_id)


# Compatibility aliases for previous clients.
@legacy_router.post("/set")
def legacy_log_set(payload: SetLogRequest, _: str = Depends(require_bearer_token)) -> dict:
    return log_set(payload, _)


@legacy_router.post("/{workout_id}/exercise")
def legacy_add_exercise_to_workout(
    workout_id: str,
    payload: AddWorkoutExerciseRequest,
    _: str = Depends(require_bearer_token),
) -> dict:
    return add_exercise_to_workout(workout_id, payload, _)
