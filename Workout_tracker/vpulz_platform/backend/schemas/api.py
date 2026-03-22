from __future__ import annotations

from pydantic import BaseModel, Field


class StartWorkoutRequest(BaseModel):
    user_id: str


class AddExerciseRequest(BaseModel):
    exercise_name: str = Field(min_length=2)


class LogSetRequest(BaseModel):
    exercise_name: str
    weight: float = Field(gt=0)
    reps: int = Field(gt=0)
    rpe: float = Field(ge=1, le=10)
    notes: str = ""


class EditSetRequest(BaseModel):
    exercise_name: str
    set_index: int = Field(ge=0)
    weight: float = Field(gt=0)
    reps: int = Field(gt=0)
    rpe: float = Field(ge=1, le=10)
    notes: str = ""


class CreateRoutineRequest(BaseModel):
    user_id: str
    name: str
    split: str


class AssistantQueryRequest(BaseModel):
    user_id: str
    question: str
