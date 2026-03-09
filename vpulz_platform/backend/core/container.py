from __future__ import annotations

from dataclasses import dataclass, field

from vpulz_platform.backend.ai.clients import GeminiClient, GroqClient
from vpulz_platform.backend.ai.orchestrator import AIAssistantOrchestrator
from vpulz_platform.backend.agents.coach_agent import CoachAgent
from vpulz_platform.backend.database.repositories import RoutineRepository, WorkoutRepository
from vpulz_platform.backend.services.analytics_service import AnalyticsService
from vpulz_platform.backend.services.prediction_service import PredictionService
from vpulz_platform.backend.services.recommendation_service import RecommendationService
from vpulz_platform.backend.services.routine_service import RoutineService
from vpulz_platform.backend.services.workout_service import WorkoutService
from vpulz_platform.backend.services.wrapped_service import WrappedService


@dataclass
class ServiceContainer:
    workout_repo: WorkoutRepository = field(default_factory=WorkoutRepository)
    routine_repo: RoutineRepository = field(default_factory=RoutineRepository)
    analytics: AnalyticsService = field(default_factory=AnalyticsService)
    predictor: PredictionService = field(default_factory=PredictionService)
    recommendations: RecommendationService = field(default_factory=RecommendationService)
    wrapped: WrappedService = field(default_factory=WrappedService)

    @property
    def workout_service(self) -> WorkoutService:
        return WorkoutService(self.workout_repo)

    @property
    def routine_service(self) -> RoutineService:
        return RoutineService(self.routine_repo)

    @property
    def coach(self) -> CoachAgent:
        return CoachAgent(AIAssistantOrchestrator(GroqClient(), GeminiClient()))


container = ServiceContainer()
