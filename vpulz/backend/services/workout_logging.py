from __future__ import annotations

from vpulz.backend.models.domain import SetLog, Workout
from vpulz.backend.repositories.memory_repo import WorkoutRepository


class WorkoutLoggingService:
    def __init__(self, repo: WorkoutRepository):
        self.repo = repo

    def start_workout(self, user_id: str) -> Workout:
        if not user_id.strip():
            raise ValueError("user_id required")
        return self.repo.start_workout(user_id)

    def add_exercise(self, workout_id: str, name: str) -> Workout:
        return self.repo.add_exercise(workout_id, name)

    def log_set(self, workout_id: str, exercise_name: str, weight: float, reps: int, rpe: float, notes: str = "") -> Workout:
        return self.repo.log_set(workout_id, exercise_name, SetLog(weight=weight, reps=reps, rpe=rpe, notes=notes))

    def finish_workout(self, workout_id: str) -> Workout:
        return self.repo.finish_workout(workout_id)
