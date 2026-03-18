from __future__ import annotations

from typing import Literal

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
    active_workout_id: str | None = None


class UpdateUserProfileRequest(BaseModel):
    user_id: str
    goal: str
    level: str
    equipment: list[str] = Field(default_factory=list)
    age: int | None = Field(default=None, ge=13, le=120)
    height_cm: float | None = Field(default=None, gt=0)
    weight_kg: float | None = Field(default=None, gt=0)
    training_days_per_week: int = Field(default=3, ge=1, le=14)
    injuries: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    preferred_split: str = "flexible"
    notes: str = ""


class ExerciseSearchRequest(BaseModel):
    user_id: str
    query: str = ""
    muscle: str | None = None
    equipment: str | None = None
    movement_pattern: str | None = None
    difficulty_level: Literal["beginner", "intermediate", "advanced"] | None = None
    tags: list[str] = Field(default_factory=list)
    only_favorites: bool = False
    include_recent: bool = True
    limit: int = Field(default=25, ge=1, le=50)


class CreateUserExerciseRequest(BaseModel):
    user_id: str
    name: str = Field(min_length=2)
    primary_muscle: str
    equipment: str
    movement_pattern: str
    notes: str = ""
    is_private: bool = True


class DuplicateCheckRequest(BaseModel):
    user_id: str
    name: str = Field(min_length=2)
    primary_muscle: str
    equipment: str
    movement_pattern: str


class ExerciseInteractionRequest(BaseModel):
    user_id: str
