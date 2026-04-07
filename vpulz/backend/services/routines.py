from __future__ import annotations

from backend.models.domain import Routine, UserProfile
from backend.repositories.memory_repo import RoutineRepository


class RoutineService:
    def __init__(self, repo: RoutineRepository):
        self.repo = repo

    def create_routine(self, user_id: str, name: str, split: str) -> Routine:
        return self.repo.create(user_id, name, split)

    def add_exercise_to_routine(self, routine_id: str, exercise_name: str) -> Routine:
        return self.repo.add_exercise(routine_id, exercise_name)

    def generate_routine_from_goal(self, profile: UserProfile) -> Routine:
        if profile.goal in {"strength", "muscle_gain"}:
            split = "push_pull_legs"
            name = "PPL Strength"
            exercises = ["Bench Press", "Barbell Row", "Squat", "Overhead Press", "Deadlift"]
        elif profile.goal == "fat_loss":
            split = "full_body"
            name = "Full Body Conditioning"
            exercises = ["Goblet Squat", "Push Up", "Row", "Lunge", "Plank"]
        else:
            split = "upper_lower"
            name = "Upper Lower Base"
            exercises = ["Bench Press", "Row", "Squat", "RDL"]

        routine = self.repo.create(profile.user_id, name, split)
        for exercise in exercises:
            self.repo.add_exercise(routine.routine_id, exercise)
        return routine
