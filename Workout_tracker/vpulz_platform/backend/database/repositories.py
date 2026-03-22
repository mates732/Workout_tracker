from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from uuid import uuid4

from vpulz_platform.backend.models.entities import Routine, SetEntry, Workout, WorkoutExercise


@dataclass
class WorkoutRepository:
    store: dict[str, Workout] = field(default_factory=dict)

    def create(self, user_id: str) -> Workout:
        workout = Workout(workout_id=str(uuid4()), user_id=user_id, started_at=datetime.utcnow())
        self.store[workout.workout_id] = workout
        return workout

    def get(self, workout_id: str) -> Workout:
        return self.store[workout_id]

    def by_user(self, user_id: str) -> list[Workout]:
        return [w for w in self.store.values() if w.user_id == user_id]


@dataclass
class RoutineRepository:
    store: dict[str, Routine] = field(default_factory=dict)

    def create(self, user_id: str, name: str, split: str) -> Routine:
        routine = Routine(routine_id=str(uuid4()), user_id=user_id, name=name, split=split)
        self.store[routine.routine_id] = routine
        return routine

    def by_user(self, user_id: str) -> list[Routine]:
        return [r for r in self.store.values() if r.user_id == user_id]
