from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class SetEntry:
    weight_kg: float
    reps: int
    rpe: float


@dataclass
class Workout:
    user_id: str
    name: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    sets: list[SetEntry] = field(default_factory=list)

    @property
    def total_volume(self) -> float:
        return sum(item.weight_kg * item.reps for item in self.sets)
