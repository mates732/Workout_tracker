from datetime import date

from workout_tracker import (
    ExerciseDefinition,
    ExerciseType,
    ExperienceLevel,
    FitnessPlatform,
    Goal,
    UserProfile,
)
from workout_tracker.ai.workout_generator import ExerciseStat


def test_end_to_end_daily_plan_connects_all_core_systems():
    platform = FitnessPlatform()
    profile = UserProfile(
        user_id="u1",
        goal=Goal.MUSCLE_GAIN,
        experience=ExperienceLevel.INTERMEDIATE,
        workout_duration_minutes=60,
        equipment=["barbell", "dumbbell"],
        preferred_split="push_pull_legs",
    )
    exercise_pool = [
        ExerciseDefinition("Bench Press", ["chest"], ExerciseType.COMPOUND, "horizontal_push"),
        ExerciseDefinition("Dumbbell Row", ["back"], ExerciseType.HYPERTROPHY, "horizontal_pull"),
    ]
    result = platform.build_daily_plan(
        profile=profile,
        exercise_pool=exercise_pool,
        recent_stats={"Bench Press": ExerciseStat(last_weight_kg=80, last_reps=8)},
        current_weight_kg=80,
        workout_days=[date(2026, 3, 9)],
        adherence_score=0.9,
    )

    assert result["workout_plan"].warmup
    assert result["workout_plan"].exercises
    assert result["diet_phase"].calorie_target > 0
    assert result["calendar"][0].event_type == "workout"
    assert result["forecast"].confidence >= 0.6


def test_workout_session_fast_logging_offline_and_pr_summary():
    platform = FitnessPlatform()
    exercises = [ExerciseDefinition("Bench Press", ["chest"], ExerciseType.COMPOUND, "horizontal_push")]

    platform.session_service.start_workout(exercises=exercises)
    first = platform.session_service.log_set("Bench Press", 80, 8, 8)
    assert first.rest_seconds_started == 120

    second = platform.session_service.quick_log("Bench Press", 80, 8, "+2.5kg")
    assert second.weight_kg == 82.5

    workout = platform.session_service.finalize_workout(online=False, duration_minutes=58)
    assert platform.session_service.sync_offline() == 1

    summary = platform.session_service.summarize(workout)
    assert summary["total_sets"] == 2
    assert summary["total_volume"] == 1300
    assert summary["new_prs"]
