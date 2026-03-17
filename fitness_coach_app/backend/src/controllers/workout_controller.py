from __future__ import annotations

from fastapi import HTTPException

from services.workout_service import WorkoutService


class WorkoutController:
    def __init__(self, service: WorkoutService) -> None:
        self.service = service

    def create(self, user_id: str, name: str) -> dict:
        try:
            workout = self.service.create_workout(user_id, name)
            return {
                "workout_index": len(self.service.list_workouts(user_id)) - 1,
                "name": workout.name,
                "user_id": workout.user_id,
                "total_sets": workout.total_sets,
                "total_volume": workout.total_volume,
            }
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    def add_exercise(self, user_id: str, workout_index: int, exercise_name: str, target_muscle: str, equipment: str, notes: str) -> dict:
        try:
            exercise = self.service.add_exercise(user_id, workout_index, exercise_name, target_muscle, equipment, notes)
            return {
                "name": exercise.name,
                "target_muscle": exercise.target_muscle,
                "equipment": exercise.equipment,
                "notes": exercise.notes,
                "sets": len(exercise.sets),
            }
        except (ValueError, IndexError, KeyError) as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    def add_set(
        self,
        user_id: str,
        workout_index: int,
        exercise_name: str,
        weight_kg: float,
        reps: int,
        rpe: float,
        rest_seconds: int,
        notes: str,
    ) -> dict:
        try:
            workout = self.service.add_set(
                user_id=user_id,
                workout_index=workout_index,
                exercise_name=exercise_name,
                weight_kg=weight_kg,
                reps=reps,
                rpe=rpe,
                rest_seconds=rest_seconds,
                notes=notes,
            )
            return {
                "name": workout.name,
                "user_id": workout.user_id,
                "total_sets": workout.total_sets,
                "total_volume": workout.total_volume,
            }
        except (ValueError, IndexError, KeyError) as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    def summary(self, user_id: str, workout_index: int) -> dict:
        try:
            return self.service.get_workout_summary(user_id, workout_index)
        except (ValueError, IndexError, KeyError) as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    def list_user_workouts(self, user_id: str) -> dict:
        workouts = self.service.list_workouts(user_id)
        return {
            "user_id": user_id,
            "count": len(workouts),
            "workouts": [
                {
                    "workout_index": idx,
                    "name": workout.name,
                    "total_sets": workout.total_sets,
                    "total_volume": workout.total_volume,
                }
                for idx, workout in enumerate(workouts)
            ],
        }
