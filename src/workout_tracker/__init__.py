from workout_tracker.ai.workout_generator import AIWorkoutGenerator, ExerciseStat
from workout_tracker.core.models import (
    DietPhase,
    ExerciseDefinition,
    ExerciseType,
    GeneratedWorkout,
    ExperienceLevel,
    Goal,
    SetLog,
    TransformationForecast,
    UserProfile,
    WorkoutHistoryEntry,
)
from workout_tracker.engine import WorkoutEngine
from workout_tracker.services.analytics import muscle_balance, strength_trend, training_load_graph
from workout_tracker.services.exercise_substitution import find_alternative, replace_if_unavailable
from workout_tracker.services.injury_prevention import detect_overuse, recommend_recovery_adjustments
from workout_tracker.services.progression import (
    calculate_estimated_1rm,
    detect_plateau,
    generate_progression_plan,
    recommend_deload,
)
from workout_tracker.services.readiness import calculate_readiness
from workout_tracker.services.coaching_engine import daily_coaching_brief, generate_coaching_tip
from workout_tracker.services.digital_twin import (
    optimize_next_week_program,
    predict_fatigue_accumulation,
    predict_strength_gain,
    simulate_training_response,
)
from workout_tracker.services.equipment_manager import detect_available_equipment, filter_exercises_by_equipment
from workout_tracker.services.exercise_intelligence import classify_exercise_stimulus, suggest_execution_cues
from workout_tracker.services.export import export_workouts_csv, export_workouts_json, generate_progress_report
from workout_tracker.services.gamification import GamificationProfile, achievement_badges, award_xp, update_streak
from workout_tracker.services.habits import HabitStatus, habit_completion_rate, habit_feedback, track_habit_completion
from workout_tracker.services.mobility import mobility_recommendations
from workout_tracker.services.notifications import (
    Notification,
    goal_milestone_notification,
    recovery_reminder,
    workout_reminder,
)
from workout_tracker.ui.theme import DARK_THEME, LIGHT_THEME, Theme, get_theme
from workout_tracker.services.goal_system import (
    UserGoal,
    create_goal,
    detect_goal_milestones,
    estimate_goal_completion,
    update_goal_progress,
)
from workout_tracker.services.periodization import (
    detect_block_end,
    generate_training_block,
    recommend_deload_week,
)
from workout_tracker.services.personal_records import detect_personal_records
from workout_tracker.services.recovery import estimate_muscle_recovery, suggest_next_training_day
from workout_tracker.services.training_load import (
    acute_chronic_ratio,
    calculate_acute_load,
    calculate_chronic_load,
    calculate_session_load,
)
from workout_tracker.services.warmup_generator import generate_warmup_sets
from workout_tracker.services.workout_quality import score_workout
from workout_tracker.services.fatigue_autoregulation import (
    AutoregulationService,
    MuscleFatigueModel,
    ReadinessSignals,
)
from workout_tracker.system import FitnessPlatform

__all__ = [
    "AIWorkoutGenerator",
    "DietPhase",
    "ExerciseDefinition",
    "ExerciseStat",
    "GeneratedWorkout",
    "ExerciseType",
    "ExperienceLevel",
    "FitnessPlatform",
    "AutoregulationService",
    "MuscleFatigueModel",
    "ReadinessSignals",
    "Goal",
    "SetLog",
    "TransformationForecast",
    "UserProfile",
    "WorkoutEngine",
    "WorkoutHistoryEntry",
    "training_load_graph",
    "muscle_balance",
    "strength_trend",
    "recommend_recovery_adjustments",
    "detect_overuse",
    "replace_if_unavailable",
    "find_alternative",
    "calculate_readiness",
    "recommend_deload",
    "detect_plateau",
    "generate_progression_plan",
    "calculate_estimated_1rm",
    "detect_goal_milestones",
    "estimate_goal_completion",
    "update_goal_progress",
    "create_goal",
    "UserGoal",
    "score_workout",
    "detect_personal_records",
    "suggest_next_training_day",
    "estimate_muscle_recovery",
    "generate_warmup_sets",
    "recommend_deload_week",
    "detect_block_end",
    "generate_training_block",
    "acute_chronic_ratio",
    "calculate_chronic_load",
    "calculate_acute_load",
    "calculate_session_load",
    "get_theme",
    "DARK_THEME",
    "LIGHT_THEME",
    "Theme",
    "goal_milestone_notification",
    "recovery_reminder",
    "workout_reminder",
    "Notification",
    "mobility_recommendations",
    "habit_feedback",
    "habit_completion_rate",
    "track_habit_completion",
    "HabitStatus",
    "achievement_badges",
    "update_streak",
    "award_xp",
    "GamificationProfile",
    "generate_progress_report",
    "export_workouts_csv",
    "export_workouts_json",
    "suggest_execution_cues",
    "classify_exercise_stimulus",
    "filter_exercises_by_equipment",
    "detect_available_equipment",
    "optimize_next_week_program",
    "predict_fatigue_accumulation",
    "predict_strength_gain",
    "simulate_training_response",
    "generate_coaching_tip",
    "daily_coaching_brief",
]
