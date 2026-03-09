from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class SetEntry:
    weight: float
    reps: int
    rpe: float
    timestamp: datetime
    notes: str = ""

    @property
    def volume(self) -> float:
        return self.weight * self.reps


@dataclass
class WorkoutExercise:
    exercise_name: str
    sets: list[SetEntry] = field(default_factory=list)


@dataclass
class Workout:
    workout_id: str
    user_id: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    exercises: list[WorkoutExercise] = field(default_factory=list)

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
    level: str
    equipment: list[str]


@dataclass
class AIInsight:
    user_id: str
    message: str
    created_at: datetime = field(default_factory=datetime.utcnow)
