from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class SetLog:
    weight: float
    reps: int
    rpe: float
    notes: str = ""

    @property
    def volume(self) -> float:
        return self.weight * self.reps


@dataclass
class ExerciseEntry:
    name: str
    sets: list[SetLog] = field(default_factory=list)


@dataclass
class Workout:
    workout_id: str
    user_id: str
    started_at: datetime
    finished_at: Optional[datetime] = None
    exercises: list[ExerciseEntry] = field(default_factory=list)

    @property
    def total_volume(self) -> float:
        return sum(s.volume for ex in self.exercises for s in ex.sets)


@dataclass
class Routine:
    routine_id: str
    user_id: str
    name: str
    split: str
    exercises: list[str] = field(default_factory=list)


@dataclass
class UserProfile:
    user_id: str
    goal: str
    equipment: list[str]
    experience: str
