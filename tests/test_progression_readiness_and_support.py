from datetime import datetime, timedelta

from workout_tracker.core.models import ExerciseDefinition, ExerciseType, GeneratedWorkout, SetLog, WorkoutHistoryEntry, WorkoutPrescription
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


def _session(days_ago: int, sets: list[SetLog], name: str = "Bench Press") -> WorkoutHistoryEntry:
    return WorkoutHistoryEntry(
        date=datetime.utcnow() - timedelta(days=days_ago),
        duration_minutes=60,
        exercises={name: sets},
    )


def test_calculate_estimated_1rm_and_progression_plan_increasing_trend():
    assert calculate_estimated_1rm(100, 5) == 116.67

    history = [
        _session(12, [SetLog(1, 80, 8, 8), SetLog(2, 80, 8, 8)]),
        _session(10, [SetLog(1, 82.5, 8, 8), SetLog(2, 82.5, 8, 8)]),
        _session(8, [SetLog(1, 85, 8, 8), SetLog(2, 85, 8, 8)]),
        _session(6, [SetLog(1, 87.5, 8, 8), SetLog(2, 87.5, 8, 8)]),
        _session(4, [SetLog(1, 90, 8, 8), SetLog(2, 90, 8, 8)]),
        _session(2, [SetLog(1, 92.5, 8, 8), SetLog(2, 92.5, 8, 8)]),
    ]

    plan = generate_progression_plan(history)
    assert plan["trend"] == "increasing"
    assert plan["next_weight"] > 92.5
    assert plan["recommended_sets"] >= 4


def test_plateau_and_deload_detection():
    plateau_sessions = [
        _session(8, [SetLog(1, 100, 5, 8.8), SetLog(2, 100, 5, 8.9)]),
        _session(6, [SetLog(1, 99, 5, 8.9), SetLog(2, 99, 5, 9.0)]),
        _session(4, [SetLog(1, 98, 5, 9.0), SetLog(2, 98, 5, 9.1)]),
        _session(2, [SetLog(1, 97, 5, 9.2), SetLog(2, 97, 5, 9.3)]),
    ]

    assert detect_plateau(plateau_sessions) is True
    assert recommend_deload(plateau_sessions) is True


def test_readiness_scoring_and_bounds():
    high = calculate_readiness(8, fatigue_score=2, previous_workout_load=2000, resting_hr=58)
    low = calculate_readiness(4.5, fatigue_score=9.5, previous_workout_load=13000, resting_hr=78)

    assert 0 <= high <= 100
    assert 0 <= low <= 100
    assert high > low


def test_exercise_substitution_and_workout_replacement():
    original = ExerciseDefinition(
        name="Barbell Bench Press",
        target_muscles=["chest"],
        exercise_type=ExerciseType.COMPOUND,
        movement_pattern="push",
        equipment="barbell",
        difficulty="intermediate",
        category="compound",
    )
    alternative = ExerciseDefinition(
        name="Dumbbell Bench Press",
        target_muscles=["chest"],
        exercise_type=ExerciseType.COMPOUND,
        movement_pattern="push",
        equipment="dumbbell",
        difficulty="intermediate",
        category="compound",
    )

    pool = [original, alternative]
    choice = find_alternative(original, pool, equipment_available=["dumbbell"])
    assert choice.name == "Dumbbell Bench Press"

    workout = GeneratedWorkout(
        split="push_pull_legs",
        warmup=["mobility"],
        exercises=[
            WorkoutPrescription(
                exercise=original,
                sets=4,
                rep_min=6,
                rep_max=8,
                target_rpe=8,
                rest_seconds=120,
                suggested_weight_kg=80,
            )
        ],
        cooldown=["stretch"],
    )
    replaced = replace_if_unavailable(workout, pool, equipment_available=["dumbbell"])
    assert replaced.exercises[0].exercise.name == "Dumbbell Bench Press"


def test_injury_prevention_and_analytics_outputs():
    overuse = detect_overuse({"chest": [1200, 1300, 1250, 1900], "back": [1400, 1450, 1500, 1520]})
    assert "chest" in overuse

    adjustments = recommend_recovery_adjustments({"chest": 8.0, "back": 5.0, "legs": 9.2})
    assert adjustments["rest_days"] == 2
    assert "chest" in adjustments["reduce_volume"]

    history = [
        _session(10, [SetLog(1, 80, 8, 8)], "Bench Press"),
        _session(5, [SetLog(1, 85, 8, 8)], "Bench Press"),
        _session(3, [SetLog(1, 90, 8, 8)], "Squat"),
    ]

    trends = strength_trend(history)
    assert len(trends["estimated_1rm_trend"]) == 3
    assert len(trends["volume_trend"]) == 3

    balance = muscle_balance(history)
    assert round(sum(balance.values()), 2) in {99.99, 100.0, 100.01}

    load = training_load_graph(history)
    assert load
