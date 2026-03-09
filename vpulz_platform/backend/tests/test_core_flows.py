from vpulz_platform.backend.ai.clients import GeminiClient, GroqClient
from vpulz_platform.backend.ai.orchestrator import AIAssistantOrchestrator
from vpulz_platform.backend.database.repositories import RoutineRepository, WorkoutRepository
from vpulz_platform.backend.models.entities import UserProfile
from vpulz_platform.backend.services.analytics_service import AnalyticsService
from vpulz_platform.backend.services.routine_service import RoutineService
from vpulz_platform.backend.services.workout_service import WorkoutService


def test_logging_and_analytics() -> None:
    repo = WorkoutRepository()
    service = WorkoutService(repo)
    analytics = AnalyticsService()

    workout = service.start_workout("u1")
    service.add_exercise(workout.workout_id, "Bench Press")
    service.log_set(workout.workout_id, "Bench Press", 80, 8, 8)
    finished = service.finish_workout(workout.workout_id)

    assert finished.total_volume == 640
    assert analytics.strength_score([finished]) > 0


def test_routine_and_ai_assistant() -> None:
    routine_service = RoutineService(RoutineRepository())
    profile = UserProfile(user_id="u1", goal="strength", level="intermediate", equipment=["barbell"])
    routine = routine_service.generate_routine_from_goal(profile)
    assert routine.exercises

    orchestrator = AIAssistantOrchestrator(GroqClient(), GeminiClient())
    answer = orchestrator.answer("What should I train today?", profile, [], [routine], fatigue_score=35)
    assert answer
