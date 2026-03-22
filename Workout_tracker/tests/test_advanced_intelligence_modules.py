from datetime import datetime, timedelta

from workout_tracker.core.models import SetLog, WorkoutHistoryEntry
from workout_tracker.services.goal_system import (
    create_goal,
    detect_goal_milestones,
    estimate_goal_completion,
    update_goal_progress,
)
from workout_tracker.services.periodization import detect_block_end, generate_training_block, recommend_deload_week
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


def _session(day_offset: int, name: str, weight: float, reps: int, rpe: float, duration: int = 60) -> WorkoutHistoryEntry:
    return WorkoutHistoryEntry(
        date=datetime.utcnow() - timedelta(days=day_offset),
        duration_minutes=duration,
        exercises={name: [SetLog(1, weight, reps, rpe), SetLog(2, weight, reps, rpe)]},
    )


def test_training_load_rollups_and_ratio():
    history = [_session(2, "Bench Press", 80, 8, 8), _session(1, "Squat", 100, 6, 8), _session(0, "Deadlift", 120, 5, 9)]

    session_load = calculate_session_load(history[-1])
    acute = calculate_acute_load(history)
    chronic = calculate_chronic_load(history)
    ratio = acute_chronic_ratio(acute, chronic)

    assert session_load > 0
    assert acute > 0
    assert chronic > 0
    assert ratio > 0


def test_periodization_block_and_deload_decisions():
    block = generate_training_block("strength", "advanced")
    assert block["block_type"] == "strength"
    assert block["duration_weeks"] >= 4

    history = [_session(35, "Bench Press", 80, 8, 8), _session(28, "Bench Press", 81, 8, 8), _session(14, "Bench Press", 80, 8, 8), _session(0, "Bench Press", 81, 8, 8)]
    assert detect_block_end(history) in {True, False}

    assert recommend_deload_week({"legs": 8.5}, "plateau") is True


def test_warmup_recovery_pr_and_quality_services():
    warmups = generate_warmup_sets(working_weight=100, working_sets=4)
    assert warmups[0]["weight"] >= 20
    assert warmups[-1]["reps"] == 3

    hours = estimate_muscle_recovery("legs", fatigue_score=8)
    rest_days = suggest_next_training_day({"legs": 8, "back": 6})
    assert hours > 72
    assert rest_days in {1, 2}

    quality = score_workout(completion_ratio=0.95, avg_rpe=8.0, rest_adherence=0.9)
    assert 0 <= quality <= 100

    history = [_session(7, "Bench Press", 80, 8, 8), _session(3, "Bench Press", 82.5, 8, 8)]
    prs = detect_personal_records("Bench Press", [_session(0, "Bench Press", 85, 8, 8).exercises["Bench Press"][0]], history)
    assert isinstance(prs, list)


def test_goal_system_lifecycle():
    goal = create_goal("u1", "bench_press", 100)
    history = [_session(3, "Bench Press", 90, 5, 8), _session(0, "Bench Press", 95, 5, 9)]

    updated = update_goal_progress(goal, history)
    assert updated.current_value >= 95

    eta = estimate_goal_completion(updated, progress_rate=0.5)
    assert eta is not None

    milestones = detect_goal_milestones(updated)
    assert "25%" in milestones
