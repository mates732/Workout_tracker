from __future__ import annotations

from dataclasses import dataclass

from backend.ai.providers import FastInferenceProvider, ReasoningProvider
from backend.ai.retrieval import KnowledgeRetriever
from backend.models.domain import Routine, UserProfile, Workout
from backend.services.progress import ProgressService


@dataclass
class AIOrchestrator:
    fast_model: FastInferenceProvider
    reasoning_model: ReasoningProvider
    retriever: KnowledgeRetriever
    progress_service: ProgressService

    def answer_question(
        self,
        question: str,
        profile: UserProfile,
        workouts: list[Workout],
        routines: list[Routine],
    ) -> str:
        context = self._build_context(profile, workouts, routines)
        knowledge = self.retriever.retrieve(question)
        prompt = f"Context:\n{context}\nKnowledge:{knowledge}\nQuestion:{question}"

        if len(question) < 70:
            return self.fast_model.generate(prompt)
        return self.reasoning_model.generate(prompt)

    def _build_context(self, profile: UserProfile, workouts: list[Workout], routines: list[Routine]) -> str:
        progress = self.progress_service.analyze(workouts)
        return (
            f"goal={profile.goal}; exp={profile.experience}; "
            f"equipment={','.join(profile.equipment)}; "
            f"workouts={len(workouts)}; routines={len(routines)}; "
            f"volume_change={progress['volume_change_pct']}%; "
            f"strength_change={progress['strength_change_pct']}%"
        )
