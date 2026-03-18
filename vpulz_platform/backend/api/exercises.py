from __future__ import annotations

from fastapi import APIRouter, HTTPException

from vpulz_platform.backend.core.container import container
from vpulz_platform.backend.models.exercise_entities import CreateUserExercisePayload, SearchFilters
from vpulz_platform.backend.schemas.api import (
    CreateUserExerciseRequest,
    DuplicateCheckRequest,
    ExerciseInteractionRequest,
    ExerciseSearchRequest,
)

router = APIRouter(prefix="/exercises", tags=["exercises"])


@router.post("/search")
def search_exercises(payload: ExerciseSearchRequest) -> dict:
    results = container.exercise_service.search_exercises(
        SearchFilters(
            user_id=payload.user_id,
            query=payload.query,
            muscle=payload.muscle,
            equipment=payload.equipment,
            movement_pattern=payload.movement_pattern,
            difficulty_level=payload.difficulty_level,
            tags=payload.tags,
            only_favorites=payload.only_favorites,
            include_recent=payload.include_recent,
            limit=payload.limit,
        )
    )
    return {"items": results, "count": len(results)}


@router.post("/custom")
def create_custom_exercise(payload: CreateUserExerciseRequest) -> dict:
    try:
        return container.exercise_service.create_user_exercise(
            CreateUserExercisePayload(
                user_id=payload.user_id,
                name=payload.name,
                primary_muscle=payload.primary_muscle,
                equipment=payload.equipment,
                movement_pattern=payload.movement_pattern,
                notes=payload.notes,
                is_private=payload.is_private,
            )
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/duplicate-check")
def duplicate_check(payload: DuplicateCheckRequest) -> dict:
    suggestions = container.exercise_service.duplicate_check(
        user_id=payload.user_id,
        name=payload.name,
        primary_muscle=payload.primary_muscle,
        equipment=payload.equipment,
        movement_pattern=payload.movement_pattern,
    )
    return {"suggestions": suggestions}


@router.post("/{exercise_id}/favorite")
def toggle_favorite(exercise_id: str, payload: ExerciseInteractionRequest) -> dict:
    try:
        return container.exercise_service.toggle_favorite(payload.user_id, exercise_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Exercise not found") from exc


@router.post("/{exercise_id}/recent")
def mark_recent(exercise_id: str, payload: ExerciseInteractionRequest) -> dict:
    try:
        return container.exercise_service.mark_recent(payload.user_id, exercise_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Exercise not found") from exc
