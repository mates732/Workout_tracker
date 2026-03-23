from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from vpulz_platform.backend.auth.supabase_auth import AuthenticatedUser, require_supabase_user
from vpulz_platform.backend.core.container import container
from vpulz_platform.backend.schemas.motia_api import (
    AICoachPayload,
    AddExercisePayload,
    CompleteSetPayload,
    FinishWorkoutPayload,
    MarkSickDayPayload,
    StartWorkoutPayload,
    SyncTrainingPlanPayload,
    SyncWithSupabasePayload,
)
from vpulz_platform.backend.workflows.motia_workflows import WorkflowError

router = APIRouter(tags=["motia-backend"])


@router.post("/workout/start")
def start_workout(payload: StartWorkoutPayload, user: AuthenticatedUser = Depends(require_supabase_user)) -> dict:
    try:
        return container.motia_workflows.run_workflow(
            "startWorkout",
            user_id=user.id,
            user_email=user.email,
            workout_date=payload.date.isoformat(),
            notes=payload.notes,
        )
    except WorkflowError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/workout/add-exercise")
def add_exercise(payload: AddExercisePayload, user: AuthenticatedUser = Depends(require_supabase_user)) -> dict:
    try:
        return container.motia_workflows.run_workflow(
            "addExerciseToWorkout",
            workout_id=payload.workout_id,
            name=payload.name,
            muscle_group=payload.muscle_group,
            equipment=payload.equipment,
        )
    except WorkflowError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/set/complete")
def complete_set(payload: CompleteSetPayload, user: AuthenticatedUser = Depends(require_supabase_user)) -> dict:
    del user
    try:
        return container.motia_workflows.run_workflow(
            "completeSet",
            set_id=payload.set_id,
            weight=payload.weight,
            reps=payload.reps,
            set_type=payload.type,
        )
    except WorkflowError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/workout/finish")
def finish_workout(payload: FinishWorkoutPayload, user: AuthenticatedUser = Depends(require_supabase_user)) -> dict:
    del user
    try:
        return container.motia_workflows.run_workflow(
            "finishWorkout",
            workout_id=payload.workout_id,
            notes=payload.notes,
        )
    except WorkflowError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/calendar")
def get_calendar(user: AuthenticatedUser = Depends(require_supabase_user)) -> dict:
    entries = container.supabase_repo.list_calendar(user.id)
    return {"items": entries}


@router.post("/calendar/sick")
def mark_sick_day(payload: MarkSickDayPayload, user: AuthenticatedUser = Depends(require_supabase_user)) -> dict:
    try:
        return container.motia_workflows.run_workflow(
            "markSickDay",
            user_id=user.id,
            target_date=payload.date.isoformat(),
        )
    except WorkflowError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/training-plan/sync")
def sync_training_plan(payload: SyncTrainingPlanPayload, user: AuthenticatedUser = Depends(require_supabase_user)) -> dict:
    try:
        return container.motia_workflows.run_workflow(
            "syncTrainingPlan",
            user_id=user.id,
            plan_type=payload.type,
            start_date=payload.start_date.isoformat(),
        )
    except WorkflowError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/sync")
def sync_with_supabase(payload: SyncWithSupabasePayload, user: AuthenticatedUser = Depends(require_supabase_user)) -> dict:
    try:
        return container.motia_workflows.run_workflow(
            "syncWithSupabase",
            user_id=user.id,
            payload=payload.local,
        )
    except WorkflowError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/ai/coach")
def ai_coach(payload: AICoachPayload, user: AuthenticatedUser = Depends(require_supabase_user)) -> dict:
    context = {"user_id": user.id, **payload.context}
    return container.ai_service.answer(payload.question, context)
