from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from uuid import uuid4

from backend.models.domain import ExerciseEntry, Routine, SetLog, Workout


@dataclass
class WorkoutRepository:
    workouts: dict[str, Workout] = field(default_factory=dict)

    def start_workout(self, user_id: str) -> Workout:
        workout_id = str(uuid4())
        workout = Workout(workout_id=workout_id, user_id=user_id, started_at=datetime.utcnow())
        self.workouts[workout_id] = workout
        return workout

    def get(self, workout_id: str) -> Workout:
        return self.workouts[workout_id]

    def add_exercise(self, workout_id: str, name: str) -> Workout:
        workout = self.get(workout_id)
        workout.exercises.append(ExerciseEntry(name=name))
        return workout

    def log_set(self, workout_id: str, exercise_name: str, set_log: SetLog) -> Workout:
        workout = self.get(workout_id)
        for exercise in workout.exercises:
            if exercise.name == exercise_name:
                exercise.sets.append(set_log)
                return workout
        raise ValueError("Exercise not found in workout")

    def finish_workout(self, workout_id: str) -> Workout:
        workout = self.get(workout_id)
        workout.finished_at = datetime.utcnow()
        return workout

    def by_user(self, user_id: str) -> list[Workout]:
        return [w for w in self.workouts.values() if w.user_id == user_id]


@dataclass
class RoutineRepository:
    routines: dict[str, Routine] = field(default_factory=dict)

    def create(self, user_id: str, name: str, split: str) -> Routine:
        routine = Routine(routine_id=str(uuid4()), user_id=user_id, name=name, split=split)
        self.routines[routine.routine_id] = routine
        return routine

    def add_exercise(self, routine_id: str, exercise_name: str) -> Routine:
        routine = self.routines[routine_id]
        routine.exercises.append(exercise_name)
        return routine

    def by_user(self, user_id: str) -> list[Routine]:
        return [r for r in self.routines.values() if r.user_id == user_id]
