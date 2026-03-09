from __future__ import annotations

from datetime import datetime

from vpulz_platform.backend.database.repositories import WorkoutRepository
from vpulz_platform.backend.models.entities import SetEntry, Workout, WorkoutExercise


class WorkoutService:
    def __init__(self, repo: WorkoutRepository):
        self.repo = repo

    def start_workout(self, user_id: str) -> Workout:
        if not user_id.strip():
            raise ValueError("user_id is required")
        return self.repo.create(user_id)

    def add_exercise(self, workout_id: str, exercise_name: str) -> Workout:
        workout = self.repo.get(workout_id)
        workout.exercises.append(WorkoutExercise(exercise_name=exercise_name))
        return workout

    def log_set(self, workout_id: str, exercise_name: str, weight: float, reps: int, rpe: float, notes: str = "") -> Workout:
        workout = self.repo.get(workout_id)
        for exercise in workout.exercises:
            if exercise.exercise_name == exercise_name:
                exercise.sets.append(SetEntry(weight=weight, reps=reps, rpe=rpe, notes=notes, timestamp=datetime.utcnow()))
                return workout
        raise ValueError("Exercise not found in workout")

    def edit_set(self, workout_id: str, exercise_name: str, set_index: int, weight: float, reps: int, rpe: float, notes: str = "") -> Workout:
        workout = self.repo.get(workout_id)
        for exercise in workout.exercises:
            if exercise.exercise_name == exercise_name:
                if set_index >= len(exercise.sets):
                    raise ValueError("set_index out of range")
                exercise.sets[set_index] = SetEntry(weight=weight, reps=reps, rpe=rpe, notes=notes, timestamp=datetime.utcnow())
                return workout
        raise ValueError("Exercise not found in workout")

    def finish_workout(self, workout_id: str) -> Workout:
        workout = self.repo.get(workout_id)
        workout.ended_at = datetime.utcnow()
        return workout
