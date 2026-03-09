# services/analytics.py
from __future__ import annotations

from collections import defaultdict
from datetime import date, timedelta

from workout_tracker.core.models import WorkoutHistoryEntry
from workout_tracker.services.progression import calculate_estimated_1rm


def strength_trend(exercise_history: list[WorkoutHistoryEntry]) -> dict[str, list[float]]:
    """Compute historical estimated 1RM and volume trends.

    Args:
        exercise_history: Chronological or unordered workout entries.

    Returns:
        Dictionary with per-session best estimated 1RM and total volume.
    """
    ordered = sorted(exercise_history, key=lambda item: item.date)
    one_rm_trend: list[float] = []
    volume_trend: list[float] = []

    for session in ordered:
        logs = [log for logs in session.exercises.values() for log in logs]
        best_1rm = max((calculate_estimated_1rm(log.weight_kg, max(1, log.reps)) for log in logs), default=0.0)
        one_rm_trend.append(round(best_1rm, 2))
        volume_trend.append(round(session.total_volume, 2))

    return {
        "estimated_1rm_trend": one_rm_trend,
        "volume_trend": volume_trend,
    }


def muscle_balance(workout_history: list[WorkoutHistoryEntry]) -> dict[str, float]:
    """Return weekly volume distribution by inferred muscle group.

    Because ``WorkoutHistoryEntry`` stores exercise names (not explicit muscle tags),
    this function infers target muscle from exercise naming conventions.
    """
    ordered = sorted(workout_history, key=lambda item: item.date)
    if not ordered:
        return {}

    window_start = ordered[-1].date.date() - timedelta(days=7)
    bucket: dict[str, float] = defaultdict(float)

    for session in ordered:
        if session.date.date() < window_start:
            continue
        for exercise_name, logs in session.exercises.items():
            muscle = _infer_muscle_from_exercise_name(exercise_name)
            bucket[muscle] += sum(log.volume for log in logs)

    total = sum(bucket.values())
    if total <= 0:
        return {key: 0.0 for key in bucket}

    return {key: round((value / total) * 100, 2) for key, value in sorted(bucket.items())}


def training_load_graph(workout_history: list[WorkoutHistoryEntry]) -> list[float]:
    """Return weekly training loads ordered by week start date."""
    ordered = sorted(workout_history, key=lambda item: item.date)
    if not ordered:
        return []

    weekly: dict[date, float] = defaultdict(float)
    for session in ordered:
        week_start = session.date.date() - timedelta(days=session.date.weekday())
        weekly[week_start] += session.total_volume

    return [round(weekly[week], 2) for week in sorted(weekly)]


def _infer_muscle_from_exercise_name(exercise_name: str) -> str:
    name = exercise_name.lower()
    mapping = {
        "chest": ["bench", "chest", "fly", "push up"],
        "back": ["row", "pull", "lat", "deadlift"],
        "legs": ["squat", "lunge", "leg", "calf"],
        "shoulders": ["press", "lateral raise", "rear delt", "shoulder"],
        "arms": ["curl", "triceps", "biceps", "extension"],
        "core": ["plank", "crunch", "core", "ab"],
    }
    for muscle, tokens in mapping.items():
        if any(token in name for token in tokens):
            return muscle
    return "other"
