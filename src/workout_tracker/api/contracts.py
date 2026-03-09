from __future__ import annotations

from dataclasses import dataclass, field
from typing import List


@dataclass
class GenerateWorkoutRequest:
    user_id: str
    goal: str
    experience_level: str
    available_equipment: List[str]
    workout_duration_minutes: int
    preferred_split: str
    target_muscles: List[str] = field(default_factory=list)
    current_phase: str = "base"
    weekly_frequency: int = 3


@dataclass
class LogSetRequest:
    session_id: str
    exercise_name: str
    weight_kg: float
    reps: int
    rpe: float
