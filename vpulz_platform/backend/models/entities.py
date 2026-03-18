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
    age: int | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    training_days_per_week: int = 3
    injuries: list[str] = field(default_factory=list)
    limitations: list[str] = field(default_factory=list)
    preferred_split: str = "flexible"
    notes: str = ""


@dataclass
class AssistantContextSnapshot:
    profile: UserProfile
    fatigue_score: float
    active_workout_id: str | None
    active_workout_exercises: list[str] = field(default_factory=list)
    recent_workout_count: int = 0
    routine_count: int = 0
    estimated_1rm: float = 0.0
    total_volume: float = 0.0
    consistency_score: float = 0.0
    strength_score: int = 0
    response_profile: str = "insufficient_data"
    training_timeline: list[str] = field(default_factory=list)
    recent_exercises: list[str] = field(default_factory=list)


@dataclass
class AIInsight:
    user_id: str
    message: str
    created_at: datetime = field(default_factory=datetime.utcnow)
