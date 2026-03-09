from __future__ import annotations

from fastapi import APIRouter

from vpulz_platform.backend.agents.coach_agent import CoachAgent
from vpulz_platform.backend.ai.clients import GeminiClient, GroqClient
from vpulz_platform.backend.ai.orchestrator import AIAssistantOrchestrator
from vpulz_platform.backend.database.repositories import RoutineRepository, WorkoutRepository
from vpulz_platform.backend.models.entities import UserProfile
from vpulz_platform.backend.schemas.api import AssistantQueryRequest
from vpulz_platform.backend.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/assistant", tags=["assistant"])

workout_repo = WorkoutRepository()
routine_repo = RoutineRepository()
analytics = AnalyticsService()
coach = CoachAgent(AIAssistantOrchestrator(GroqClient(), GeminiClient()))


@router.post("/ask")
def ask_assistant(payload: AssistantQueryRequest) -> dict:
    workouts = workout_repo.by_user(payload.user_id)
    routines = routine_repo.by_user(payload.user_id)
    profile = UserProfile(user_id=payload.user_id, goal="strength", level="intermediate", equipment=["barbell", "dumbbell"])
    fatigue = analytics.fatigue_score(workouts)
    answer = coach.respond(payload.question, profile, workouts, routines, fatigue)
    return {"answer": answer, "fatigue_score": fatigue}
