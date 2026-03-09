from __future__ import annotations

from dataclasses import dataclass

from vpulz_platform.backend.ai.clients import GeminiClient, GroqClient
from vpulz_platform.backend.ai.context_builder import build_context
from vpulz_platform.backend.ai.model_router import choose_model
from vpulz_platform.backend.ai.rule_engine import rule_based_answer
from vpulz_platform.backend.models.entities import Routine, UserProfile, Workout


@dataclass
class AIAssistantOrchestrator:
    fast_client: GroqClient
    reasoning_client: GeminiClient

    def answer(
        self,
        question: str,
        profile: UserProfile,
        workouts: list[Workout],
        routines: list[Routine],
        fatigue_score: float,
    ) -> str:
        direct = rule_based_answer(question, fatigue_score)
        if direct:
            return direct

        context = build_context(profile, workouts, routines, fatigue_score)
        prompt = f"Context: {context}\nQuestion: {question}"
        model = choose_model(question)
        if model == "reasoning":
            return self.reasoning_client.infer(prompt)
        return self.fast_client.infer(prompt)
