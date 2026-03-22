from __future__ import annotations

from fastapi import APIRouter

from vpulz.backend.ai.orchestrator import AIOrchestrator
from vpulz.backend.ai.providers import FastInferenceProvider, ReasoningProvider
from vpulz.backend.ai.retrieval import KnowledgeRetriever
from vpulz.backend.models.domain import UserProfile
from vpulz.backend.repositories.memory_repo import RoutineRepository, WorkoutRepository
from vpulz.backend.schemas.api import AssistantRequest
from vpulz.backend.services.progress import ProgressService

router = APIRouter(prefix="/assistant", tags=["assistant"])

workout_repo = WorkoutRepository()
routine_repo = RoutineRepository()
orchestrator = AIOrchestrator(
    fast_model=FastInferenceProvider(),
    reasoning_model=ReasoningProvider(),
    retriever=KnowledgeRetriever(),
    progress_service=ProgressService(),
)


@router.post("/ask")
def ask_assistant(payload: AssistantRequest) -> dict:
    profile = UserProfile(user_id=payload.user_id, goal="strength", experience="intermediate", equipment=["barbell", "dumbbell"])
    workouts = workout_repo.by_user(payload.user_id)
    routines = routine_repo.by_user(payload.user_id)
    answer = orchestrator.answer_question(payload.question, profile, workouts, routines)
    return {"answer": answer}
