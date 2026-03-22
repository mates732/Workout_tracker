from __future__ import annotations

from fastapi import HTTPException

from services.workout_service import WorkoutService


class WorkoutController:
    def __init__(self, service: WorkoutService) -> None:
        self.service = service

    def create(self, user_id: str, name: str) -> dict:
        try:
            workout = self.service.create_workout(user_id, name)
            return {"name": workout.name, "user_id": workout.user_id, "total_volume": workout.total_volume}
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
