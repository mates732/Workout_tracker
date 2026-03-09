from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from typing import List, Optional


class Goal(str, Enum):
    MUSCLE_GAIN = "muscle_gain"
    FAT_LOSS = "fat_loss"
    STRENGTH = "strength"
    HYPERTROPHY = "hypertrophy"
    GENERAL_FITNESS = "general_fitness"


class ExperienceLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class ExerciseType(str, Enum):
    COMPOUND = "compound"
    HYPERTROPHY = "hypertrophy"
    ISOLATION = "isolation"


REST_SECONDS = {
    ExerciseType.COMPOUND: 120,
    ExerciseType.HYPERTROPHY: 90,
    ExerciseType.ISOLATION: 60,
}


@dataclass
class UserProfile:
    user_id: str
    goal: Goal
    experience: ExperienceLevel
    workout_duration_minutes: int
    equipment: List[str]
    preferred_split: str
    weekly_frequency: int = 3
    target_muscles: List[str] = field(default_factory=list)
    current_phase: str = "base"


@dataclass
class ExerciseDefinition:
    name: str
    target_muscles: List[str]
    exercise_type: ExerciseType
    movement_pattern: str = "general"
    equipment: str = "bodyweight"
    difficulty: str = "beginner"
    category: str = "general"
    instructions: str = ""
    video_url: str = ""
    superset_group: Optional[str] = None


@dataclass
class WorkoutPrescription:
    exercise: ExerciseDefinition
    sets: int
    rep_min: int
    rep_max: int
    target_rpe: float
    rest_seconds: int
    suggested_weight_kg: Optional[float] = None


@dataclass
class GeneratedWorkout:
    split: str
    warmup: List[str]
    exercises: List[WorkoutPrescription]
    cooldown: List[str]


@dataclass
class SetLog:
    set_number: int
    weight_kg: float
    reps: int
    rpe: float
    completed: bool = True
    rest_seconds_started: int = 0

    @property
    def volume(self) -> float:
        return self.weight_kg * self.reps


@dataclass
class WorkoutSession:
    session_id: str
    user_id: str
    started_at: datetime
    exercises: List[ExerciseDefinition]
    set_logs: dict[str, List[SetLog]] = field(default_factory=dict)


@dataclass
class WorkoutHistoryEntry:
    date: datetime
    duration_minutes: int
    exercises: dict[str, List[SetLog]]

    @property
    def total_sets(self) -> int:
        return sum(len(v) for v in self.exercises.values())

    @property
    def total_volume(self) -> float:
        return sum(log.volume for logs in self.exercises.values() for log in logs)


@dataclass
class DietPhase:
    phase: str
    calorie_target: int
    protein_target_g: int
    start_date: date
    end_date: date


@dataclass
class TransformationForecast:
    expected_weight_kg: float
    expected_body_fat_pct: float
    confidence: float
