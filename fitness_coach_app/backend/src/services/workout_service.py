from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict

from models.workout import ExerciseEntry, SetEntry, Workout


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

    def add_exercise(
        self,
        user_id: str,
        workout_index: int,
        exercise_name: str,
        target_muscle: str = "",
        equipment: str = "",
        notes: str = "",
    ) -> ExerciseEntry:
        if not exercise_name.strip():
            raise ValueError("exercise_name is required")
        workout = self.storage[user_id][workout_index]
        existing = workout.get_exercise(exercise_name)
        if existing:
            return existing
        exercise = ExerciseEntry(
            name=exercise_name.strip(),
            target_muscle=target_muscle.strip(),
            equipment=equipment.strip(),
            notes=notes.strip(),
        )
        workout.exercises.append(exercise)
        return exercise

    def add_set(
        self,
        user_id: str,
        workout_index: int,
        weight_kg: float,
        reps: int,
        rpe: float,
        exercise_name: str = "General",
        rest_seconds: int = 90,
        notes: str = "",
    ) -> Workout:
        if weight_kg <= 0 or reps <= 0 or not 1 <= rpe <= 10:
            raise ValueError("Invalid set payload")
        if rest_seconds < 0:
            raise ValueError("rest_seconds must be >= 0")

        workout = self.storage[user_id][workout_index]
        exercise = workout.get_exercise(exercise_name)
        if not exercise:
            exercise = self.add_exercise(user_id, workout_index, exercise_name)

        exercise.sets.append(
            SetEntry(
                weight_kg=weight_kg,
                reps=reps,
                rpe=rpe,
                rest_seconds=rest_seconds,
                notes=notes.strip(),
            )
        )
        return workout

    def get_workout_summary(self, user_id: str, workout_index: int) -> dict:
        workout = self.storage[user_id][workout_index]
        exercise_summaries = [
            {
                "name": exercise.name,
                "target_muscle": exercise.target_muscle,
                "equipment": exercise.equipment,
                "sets": len(exercise.sets),
                "volume": exercise.total_volume,
            }
            for exercise in workout.exercises
        ]

        return {
            "user_id": workout.user_id,
            "name": workout.name,
            "total_sets": workout.total_sets,
            "total_volume": workout.total_volume,
            "exercises": exercise_summaries,
        }

    def list_workouts(self, user_id: str) -> list[Workout]:
        return self.storage.get(user_id, [])
