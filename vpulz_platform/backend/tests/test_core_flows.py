from vpulz_platform.backend.ai.clients import GeminiClient, GroqClient
from vpulz_platform.backend.ai.orchestrator import AIAssistantOrchestrator
from vpulz_platform.backend.core.container import container
from vpulz_platform.backend.models.entities import UserProfile
from vpulz_platform.backend.services.analytics_service import AnalyticsService


def setup_function() -> None:
    container.workout_repo.store.clear()
    container.routine_repo.store.clear()


def test_logging_and_analytics() -> None:
    service = container.workout_service
    analytics = AnalyticsService()

    workout = service.start_workout("u1")
    service.add_exercise(workout.workout_id, "Bench Press")
    service.log_set(workout.workout_id, "Bench Press", 80, 8, 8)
    finished = service.finish_workout(workout.workout_id)

    assert finished.total_volume == 640
    assert analytics.strength_score([finished]) > 0


def test_routine_and_ai_assistant() -> None:
    profile = UserProfile(user_id="u1", goal="strength", level="intermediate", equipment=["barbell"])
    routine = container.routine_service.generate_routine_from_goal(profile)
    assert routine.exercises

    orchestrator = AIAssistantOrchestrator(GroqClient(), GeminiClient())
    answer = orchestrator.answer("What should I train today?", profile, [], [routine], fatigue_score=35)
    assert answer


def test_shared_repositories_enable_analytics_and_companion_features() -> None:
    service = container.workout_service
    workout = service.start_workout("u-api")
    service.add_exercise(workout.workout_id, "Bench Press")
    service.log_set(workout.workout_id, "Bench Press", 100, 5, 8.5, "solid")

    workouts = container.workout_repo.by_user("u-api")
    assert len(workouts) == 1
    progress = container.analytics.progress_snapshot(workouts)
    assert progress["total_volume"] == 500.0

    warmups = container.recommendations.generate_warmup_sets(120)
    assert len(warmups) == 4

    feedback = container.recommendations.realtime_companion_feedback(workout.exercises[0].sets[0], target_reps=5)
    assert feedback
