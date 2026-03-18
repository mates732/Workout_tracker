from __future__ import annotations

from fastapi import HTTPException

from services.workout_service import WorkoutService


class WorkoutController:
    def __init__(self, service: WorkoutService) -> None:
        self.service = service

    @staticmethod
    def _detail_from_key_error(exc: KeyError, default: str) -> str:
        return str(exc.args[0]) if exc.args else default

    def start_workout_session(self, user_id: str) -> dict:
        try:
            return self.service.start_session(user_id)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    def finish_workout_session(self, workout_id: str) -> dict:
        try:
            return self.service.finish_session(workout_id)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=self._detail_from_key_error(exc, "Workout session not found")) from exc

    def active_workout_session(self, user_id: str) -> dict:
        try:
            return self.service.get_active_session(user_id)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    def get_workout_state(self, workout_id: str) -> dict:
        try:
            return self.service.get_workout_state(workout_id)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=self._detail_from_key_error(exc, "Workout session not found")) from exc

    def search_exercises(self, query: str | None, muscle_group: str | None, limit: int) -> dict:
        try:
            return self.service.search_exercises(query=query, muscle_group=muscle_group, limit=limit)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    def add_exercise_to_workout(self, workout_id: str, exercise_id: int | None, exercise_name: str | None) -> dict:
        try:
            return self.service.add_exercise_to_workout(
                workout_id=workout_id,
                exercise_id=exercise_id,
                exercise_name=exercise_name,
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except KeyError as exc:
            detail = self._detail_from_key_error(exc, "Resource not found")
            status_code = 404
            raise HTTPException(status_code=status_code, detail=detail) from exc

    def log_set(
        self,
        workout_id: str,
        weight: float,
        reps: int,
        rpe: float,
        duration: int,
        completed: bool,
        workout_exercise_id: str | None,
        exercise_id: int | None,
        exercise_name: str | None,
    ) -> dict:
        try:
            return self.service.log_set(
                workout_id=workout_id,
                weight=weight,
                reps=reps,
                rpe=rpe,
                duration=duration,
                completed=completed,
                workout_exercise_id=workout_exercise_id,
                exercise_id=exercise_id,
                exercise_name=exercise_name,
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=self._detail_from_key_error(exc, "Resource not found")) from exc

    def update_set(
        self,
        set_id: str,
        weight: float | None,
        reps: int | None,
        rpe: float | None,
        duration: int | None,
        completed: bool | None,
    ) -> dict:
        try:
            return self.service.update_set(
                set_id=set_id,
                weight=weight,
                reps=reps,
                rpe=rpe,
                duration=duration,
                completed=completed,
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=self._detail_from_key_error(exc, "Resource not found")) from exc

    def get_exercise_progress(self, exercise_id: int, user_id: str | None) -> dict:
        try:
            return self.service.get_progress(exercise_id=exercise_id, user_id=user_id)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=self._detail_from_key_error(exc, "Exercise not found")) from exc
