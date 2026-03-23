from __future__ import annotations

from dataclasses import dataclass, field

from vpulz_platform.backend.ai.motia_client import MotiaClient
from vpulz_platform.backend.ai.clients import GeminiClient, GroqClient
from vpulz_platform.backend.ai.orchestrator import AIAssistantOrchestrator
from vpulz_platform.backend.database.supabase_workflow_repository import SupabaseWorkflowRepository
from vpulz_platform.backend.database.exercise_repository import ExerciseRepository
from vpulz_platform.backend.database.profile_repository import UserProfileRepository
from vpulz_platform.backend.agents.coach_agent import CoachAgent
from vpulz_platform.backend.database.repositories import RoutineRepository, WorkoutRepository
from vpulz_platform.backend.services.ai_service import AIService
from vpulz_platform.backend.services.exercise_service import ExerciseService
from vpulz_platform.backend.services.analytics_service import AnalyticsService
from vpulz_platform.backend.services.prediction_service import PredictionService
from vpulz_platform.backend.services.profile_service import ProfileService
from vpulz_platform.backend.services.recommendation_service import RecommendationService
from vpulz_platform.backend.services.routine_service import RoutineService
from vpulz_platform.backend.services.workout_service import WorkoutService
from vpulz_platform.backend.services.wrapped_service import WrappedService
from vpulz_platform.backend.workflows.motia_workflows import MotiaWorkflowEngine
from vpulz_platform.backend.utils.config import settings


@dataclass
class ServiceContainer:
    workout_repo: WorkoutRepository = field(default_factory=WorkoutRepository)
    routine_repo: RoutineRepository = field(default_factory=RoutineRepository)
    profile_repo: UserProfileRepository = field(default_factory=UserProfileRepository)
    exercise_repo: ExerciseRepository = field(default_factory=ExerciseRepository)
    supabase_repo: SupabaseWorkflowRepository = field(default_factory=SupabaseWorkflowRepository)
    motia: MotiaClient = field(
        default_factory=lambda: MotiaClient(base_url=settings.motia_base_url, api_key=settings.motia_api_key)
    )
    analytics: AnalyticsService = field(default_factory=AnalyticsService)
    predictor: PredictionService = field(default_factory=PredictionService)
    recommendations: RecommendationService = field(default_factory=RecommendationService)
    wrapped: WrappedService = field(default_factory=WrappedService)
    ai_service: AIService = field(default_factory=AIService)

    @property
    def workout_service(self) -> WorkoutService:
        return WorkoutService(self.workout_repo)

    @property
    def routine_service(self) -> RoutineService:
        return RoutineService(self.routine_repo)

    @property
    def profile_service(self) -> ProfileService:
        return ProfileService(self.profile_repo)

    @property
    def exercise_service(self) -> ExerciseService:
        return ExerciseService(self.exercise_repo, self.motia)

    @property
    def coach(self) -> CoachAgent:
        return CoachAgent(AIAssistantOrchestrator(GroqClient(), GeminiClient()))

    @property
    def motia_workflows(self) -> MotiaWorkflowEngine:
        return MotiaWorkflowEngine(self.supabase_repo, self.motia)


container = ServiceContainer()
