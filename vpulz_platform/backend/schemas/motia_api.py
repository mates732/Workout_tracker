from __future__ import annotations

from datetime import date
from typing import Any, Literal

from pydantic import BaseModel, Field


class StartWorkoutPayload(BaseModel):
    date: date
    notes: str = ""


class AddExercisePayload(BaseModel):
    workout_id: str
    name: str = Field(min_length=2)
    muscle_group: str = "unknown"
    equipment: str = "bodyweight"


class CompleteSetPayload(BaseModel):
    set_id: str
    weight: float = Field(ge=0)
    reps: int = Field(ge=0)
    type: Literal["W", "normal", "D", "F"] = "normal"


class FinishWorkoutPayload(BaseModel):
    workout_id: str
    notes: str | None = None


class MarkSickDayPayload(BaseModel):
    date: date


class SyncTrainingPlanPayload(BaseModel):
    type: str = Field(min_length=2)
    start_date: date


class SyncWithSupabasePayload(BaseModel):
    local: dict[str, Any] = Field(default_factory=dict)


class AICoachPayload(BaseModel):
    question: str = Field(min_length=2)
    context: dict[str, Any] = Field(default_factory=dict)
