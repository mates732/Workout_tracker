from __future__ import annotations

from fastapi import APIRouter

from vpulz_platform.backend.core.container import container
from vpulz_platform.backend.models.entities import UserProfile
from vpulz_platform.backend.schemas.api import AssistantQueryRequest

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.post("/ask")
def ask_assistant(payload: AssistantQueryRequest) -> dict:
    workouts = container.workout_repo.by_user(payload.user_id)
    routines = container.routine_repo.by_user(payload.user_id)
    profile = UserProfile(user_id=payload.user_id, goal="strength", level="intermediate", equipment=["barbell", "dumbbell"])
    fatigue = container.analytics.fatigue_score(workouts)
    answer = container.coach.respond(payload.question, profile, workouts, routines, fatigue)
    return {"answer": answer, "fatigue_score": fatigue}
