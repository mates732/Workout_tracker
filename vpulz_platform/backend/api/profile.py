from __future__ import annotations

from fastapi import APIRouter, HTTPException

from vpulz_platform.backend.core.container import container
from vpulz_platform.backend.models.entities import UserProfile
from vpulz_platform.backend.schemas.api import UpdateUserProfileRequest

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/{user_id}")
def get_profile(user_id: str) -> dict:
    try:
        profile = container.profile_service.get_profile(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {
        "user_id": profile.user_id,
        "goal": profile.goal,
        "level": profile.level,
        "equipment": profile.equipment,
        "age": profile.age,
        "height_cm": profile.height_cm,
        "weight_kg": profile.weight_kg,
        "training_days_per_week": profile.training_days_per_week,
        "injuries": profile.injuries,
        "limitations": profile.limitations,
        "preferred_split": profile.preferred_split,
        "notes": profile.notes,
    }


@router.put("/{user_id}")
def update_profile(user_id: str, payload: UpdateUserProfileRequest) -> dict:
    if user_id != payload.user_id:
        raise HTTPException(status_code=400, detail="user_id mismatch")

    profile = container.profile_service.update_profile(
        UserProfile(
            user_id=payload.user_id,
            goal=payload.goal,
            level=payload.level,
            equipment=payload.equipment,
            age=payload.age,
            height_cm=payload.height_cm,
            weight_kg=payload.weight_kg,
            training_days_per_week=payload.training_days_per_week,
            injuries=payload.injuries,
            limitations=payload.limitations,
            preferred_split=payload.preferred_split,
            notes=payload.notes,
        )
    )
    return {"status": "ok", "user_id": profile.user_id}
