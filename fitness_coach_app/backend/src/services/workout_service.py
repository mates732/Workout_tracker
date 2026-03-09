from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict

from models.workout import Workout, SetEntry


@dataclass
class WorkoutService:
    """Application service for workout session state and analytics."""

    storage: Dict[str, list[Workout]] = field(default_factory=dict)

    def create_workout(self, user_id: str, name: str) -> Workout:
        if not user_id.strip() or not name.strip():
            raise ValueError("user_id and name are required")
        workout = Workout(user_id=user_id, name=name)
        self.storage.setdefault(user_id, []).append(workout)
        return workout

    def add_set(self, user_id: str, workout_index: int, weight_kg: float, reps: int, rpe: float) -> Workout:
        if weight_kg <= 0 or reps <= 0 or not 1 <= rpe <= 10:
            raise ValueError("Invalid set payload")
        workout = self.storage[user_id][workout_index]
        workout.sets.append(SetEntry(weight_kg=weight_kg, reps=reps, rpe=rpe))
        return workout

    def list_workouts(self, user_id: str) -> list[Workout]:
        return self.storage.get(user_id, [])
