from __future__ import annotations

from datetime import date
from typing import Dict, List, Optional

from workout_tracker.ai.workout_generator import AIWorkoutGenerator, ExerciseStat
from workout_tracker.core.models import ExerciseDefinition, UserProfile
from workout_tracker.services.calendar import CalendarPlanningService
from workout_tracker.services.fatigue_autoregulation import AutoregulationService, MuscleFatigueModel, ReadinessSignals
from workout_tracker.services.planning import DietPhasePlanner, TransformationPredictionEngine
from workout_tracker.services.workout_session import WorkoutSessionService


class FitnessPlatform:
    """Connects all core systems into one product-level facade."""

    def __init__(self) -> None:
        self.workout_generator = AIWorkoutGenerator()
        self.session_service = WorkoutSessionService()
        self.diet_planner = DietPhasePlanner()
        self.calendar_service = CalendarPlanningService()
        self.transform_engine = TransformationPredictionEngine()
        self.fatigue_model = MuscleFatigueModel()
        self.autoregulation = AutoregulationService()

    def build_daily_plan(
        self,
        profile: UserProfile,
        exercise_pool: List[ExerciseDefinition],
        recent_stats: Dict[str, ExerciseStat],
        current_weight_kg: float,
        workout_days: List[date],
        adherence_score: float,
        readiness: Optional[ReadinessSignals] = None,
    ) -> dict:
        workout = self.workout_generator.generate(profile, exercise_pool, recent_stats)
        if readiness is not None:
            workout.exercises = self.autoregulation.adjust_next_workout(workout.exercises, readiness)

        diet_phase = self.diet_planner.current_phase(profile, current_weight_kg)
        calendar = self.calendar_service.build_month_plan(workout_days, diet_phase.phase)
        forecast = self.transform_engine.forecast(profile, current_weight_kg, adherence_score)

        return {
            "workout_plan": workout,
            "diet_phase": diet_phase,
            "calendar": calendar,
            "forecast": forecast,
        }

    def record_session_fatigue(self) -> Dict[str, float]:
        if not self.session_service.active_session:
            return {}
        session = self.session_service.active_session
        return self.fatigue_model.score_workout_fatigue(session.exercises, session.set_logs)
