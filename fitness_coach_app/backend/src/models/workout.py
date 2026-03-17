from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class SetEntry:
    weight_kg: float
    reps: int
    rpe: float
    rest_seconds: int = 90
    notes: str = ""

    @property
    def volume(self) -> float:
        return self.weight_kg * self.reps


@dataclass
class ExerciseEntry:
    name: str
    target_muscle: str = ""
    equipment: str = ""
    notes: str = ""
    sets: list[SetEntry] = field(default_factory=list)

    @property
    def total_volume(self) -> float:
        return sum(item.volume for item in self.sets)


@dataclass
class Workout:
    user_id: str
    name: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    exercises: list[ExerciseEntry] = field(default_factory=list)

    @property
    def sets(self) -> list[SetEntry]:
        """Backward-compatible flattened set list."""
        return [entry for exercise in self.exercises for entry in exercise.sets]

    @property
    def total_volume(self) -> float:
        return sum(exercise.total_volume for exercise in self.exercises)

    @property
    def total_sets(self) -> int:
        return sum(len(exercise.sets) for exercise in self.exercises)

    def get_exercise(self, exercise_name: str) -> ExerciseEntry | None:
        normalized = exercise_name.strip().lower()
        return next((exercise for exercise in self.exercises if exercise.name.strip().lower() == normalized), None)
