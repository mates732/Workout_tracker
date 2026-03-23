from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any

from vpulz_platform.backend.ai.motia_client import MotiaClient
from vpulz_platform.backend.database.supabase_workflow_repository import (
    SupabaseRepositoryError,
    SupabaseWorkflowRepository,
)


class WorkflowError(RuntimeError):
    pass


@dataclass
class MotiaWorkflowEngine:
    repository: SupabaseWorkflowRepository
    motia: MotiaClient

    def start_workout(self, user_id: str, user_email: str, workout_date: str, notes: str = "") -> dict[str, Any]:
        self.repository.ensure_user(user_id=user_id, email=user_email)

        existing = self.repository.active_workout_by_user(user_id)
        if existing:
            return {
                "workout_id": existing.id,
                "date": existing.date,
                "reused_existing": True,
            }

        workout = self.repository.create_workout(user_id=user_id, workout_date=workout_date, notes=notes)
        self.repository.upsert_calendar_entry(user_id=user_id, iso_date=workout_date, status="planned")

        return {
            "workout_id": workout.id,
            "date": workout.date,
            "reused_existing": False,
        }

    def add_exercise_to_workout(self, workout_id: str, name: str, muscle_group: str, equipment: str) -> dict[str, Any]:
        exercise_id = self.repository.find_or_create_exercise(name=name, muscle_group=muscle_group, equipment=equipment)
        order_index = self.repository.next_order_index(workout_id=workout_id)
        workout_exercise_id = self.repository.attach_exercise_to_workout(
            workout_id=workout_id,
            exercise_id=exercise_id,
            order_index=order_index,
        )
        default_set_id = self.repository.create_default_set(workout_exercise_id=workout_exercise_id)

        return {
            "workout_exercise_id": workout_exercise_id,
            "default_set_id": default_set_id,
            "order_index": order_index,
        }

    def complete_set(self, set_id: str, weight: float, reps: int, set_type: str) -> dict[str, Any]:
        self.repository.complete_set(set_id=set_id, weight=weight, reps=reps, set_type=set_type)
        return {
            "set_id": set_id,
            "completed": True,
            "analytics_triggered": True,
        }

    def finish_workout(self, workout_id: str, notes: str | None = None) -> dict[str, Any]:
        workout = self.repository.get_workout(workout_id)

        try:
            started_at = datetime.fromisoformat(workout.created_at.replace("Z", "+00:00"))
        except ValueError as exc:
            raise WorkflowError("Invalid workout timestamp") from exc

        duration = max(int((datetime.utcnow() - started_at).total_seconds() // 60), 1)
        self.repository.finish_workout(workout_id=workout_id, duration=duration, notes=notes)
        self.repository.upsert_calendar_entry(user_id=workout.user_id, iso_date=workout.date, status="completed")

        return {
            "workout_id": workout_id,
            "duration": duration,
            "status": "completed",
        }

    def sync_training_plan(self, user_id: str, plan_type: str, start_date: str) -> dict[str, Any]:
        plan_id = self.repository.upsert_training_plan(user_id=user_id, plan_type=plan_type)
        planned_dates = self.repository.populate_two_week_calendar(user_id=user_id, start_iso_date=start_date)
        return {
            "training_plan_id": plan_id,
            "planned_dates": planned_dates,
        }

    def mark_sick_day(self, user_id: str, target_date: str) -> dict[str, Any]:
        self.repository.upsert_calendar_entry(user_id=user_id, iso_date=target_date, status="sick")
        return {
            "date": target_date,
            "status": "sick",
        }

    def sync_with_supabase(self, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        return self.repository.sync_payload(user_id=user_id, payload=payload)

    def run_workflow(self, workflow_name: str, **kwargs: Any) -> dict[str, Any]:
        handlers = {
            "startWorkout": lambda: self.start_workout(**kwargs),
            "addExerciseToWorkout": lambda: self.add_exercise_to_workout(**kwargs),
            "completeSet": lambda: self.complete_set(**kwargs),
            "finishWorkout": lambda: self.finish_workout(**kwargs),
            "syncTrainingPlan": lambda: self.sync_training_plan(**kwargs),
            "markSickDay": lambda: self.mark_sick_day(**kwargs),
            "syncWithSupabase": lambda: self.sync_with_supabase(**kwargs),
        }

        if workflow_name not in handlers:
            raise WorkflowError(f"Unknown workflow: {workflow_name}")

        try:
            return handlers[workflow_name]()
        except SupabaseRepositoryError as exc:
            raise WorkflowError(str(exc)) from exc
