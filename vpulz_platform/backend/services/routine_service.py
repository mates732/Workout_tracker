from __future__ import annotations

from vpulz_platform.backend.database.repositories import RoutineRepository
from vpulz_platform.backend.models.entities import Routine, UserProfile


class RoutineService:
    def __init__(self, repo: RoutineRepository):
        self.repo = repo

    def create_routine(self, user_id: str, name: str, split: str) -> Routine:
        return self.repo.create(user_id, name, split)

    def add_exercise_to_routine(self, routine_id: str, exercise_name: str) -> Routine:
        routine = self.repo.store[routine_id]
        routine.exercises.append(exercise_name)
        return routine

    def generate_routine_from_goal(self, profile: UserProfile) -> Routine:
        if profile.goal == "strength":
            split, exercises = "upper/lower", ["Bench Press", "Squat", "Deadlift", "Row", "Overhead Press"]
        elif profile.goal == "hypertrophy":
            split, exercises = "push/pull/legs", ["Incline Press", "Lat Pulldown", "Leg Press", "Lateral Raise", "RDL"]
        else:
            split, exercises = "full body", ["Goblet Squat", "Push Up", "Dumbbell Row", "Lunge", "Plank"]

        routine = self.repo.create(profile.user_id, f"{split.title()} Auto", split)
        routine.exercises.extend(exercises)
        return routine
