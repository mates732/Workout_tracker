from __future__ import annotations

from dataclasses import dataclass

from vpulz_platform.backend.ai.orchestrator import AIAssistantOrchestrator
from vpulz_platform.backend.models.entities import Routine, UserProfile, Workout


@dataclass
class CoachAgent:
    orchestrator: AIAssistantOrchestrator

    def respond(self, question: str, profile: UserProfile, workouts: list[Workout], routines: list[Routine], fatigue_score: float) -> str:
        return self.orchestrator.answer(question, profile, workouts, routines, fatigue_score)
