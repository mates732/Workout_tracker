from vpulz.backend.ai.orchestrator import AIOrchestrator
from vpulz.backend.ai.providers import FastInferenceProvider, ReasoningProvider
from vpulz.backend.ai.retrieval import KnowledgeRetriever
from vpulz.backend.models.domain import UserProfile
from vpulz.backend.repositories.memory_repo import RoutineRepository, WorkoutRepository
from vpulz.backend.services.progress import ProgressService
from vpulz.backend.services.routines import RoutineService
from vpulz.backend.services.workout_logging import WorkoutLoggingService


def test_workout_logging_flow() -> None:
    repo = WorkoutRepository()
    service = WorkoutLoggingService(repo)

    workout = service.start_workout("u1")
    service.add_exercise(workout.workout_id, "Bench Press")
    updated = service.log_set(workout.workout_id, "Bench Press", weight=80, reps=8, rpe=8)
    assert updated.total_volume == 640


def test_routine_generation_and_ai_assistant() -> None:
    routine_service = RoutineService(RoutineRepository())
    profile = UserProfile(user_id="u1", goal="strength", equipment=["barbell"], experience="intermediate")
    routine = routine_service.generate_routine_from_goal(profile)
    assert routine.exercises

    orchestrator = AIOrchestrator(
        fast_model=FastInferenceProvider(),
        reasoning_model=ReasoningProvider(),
        retriever=KnowledgeRetriever(),
        progress_service=ProgressService(),
    )
    answer = orchestrator.answer_question("What should I train today?", profile, workouts=[], routines=[routine])
    assert answer
