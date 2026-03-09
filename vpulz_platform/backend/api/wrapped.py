from __future__ import annotations

from fastapi import APIRouter

from vpulz_platform.backend.core.container import container
from vpulz_platform.backend.schemas.wrapped import WrappedResponse

router = APIRouter(prefix="/wrapped", tags=["wrapped"])


@router.get("/{user_id}", response_model=WrappedResponse)
def get_wrapped(user_id: str, period: str = "monthly") -> dict:
    workouts = container.workout_repo.by_user(user_id)
    return container.wrapped.generate_wrapped(workouts, period)
