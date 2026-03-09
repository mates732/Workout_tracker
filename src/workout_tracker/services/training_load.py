# services/training_load.py
from __future__ import annotations

from statistics import mean

from workout_tracker.core.models import WorkoutHistoryEntry


def calculate_session_load(workout: WorkoutHistoryEntry) -> float:
    """Calculate single-session training load from logged volume.

    Args:
        workout: Workout history entry.

    Returns:
        Session load rounded to two decimals.
    """
    return round(max(0.0, workout.total_volume), 2)


def calculate_acute_load(history: list[WorkoutHistoryEntry]) -> float:
    """Calculate acute load as average session load over last 7 days."""
    recent = _recent_by_days(history, days=7)
    if not recent:
        return 0.0
    return round(mean(calculate_session_load(item) for item in recent), 2)


def calculate_chronic_load(history: list[WorkoutHistoryEntry]) -> float:
    """Calculate chronic load as average session load over last 28 days."""
    recent = _recent_by_days(history, days=28)
    if not recent:
        return 0.0
    return round(mean(calculate_session_load(item) for item in recent), 2)


def acute_chronic_ratio(acute: float, chronic: float) -> float:
    """Calculate acute-to-chronic workload ratio with safe zero handling."""
    if acute < 0 or chronic < 0:
        raise ValueError("acute and chronic loads must be non-negative")
    if chronic == 0:
        return 0.0 if acute == 0 else float("inf")
    return round(acute / chronic, 2)


def _recent_by_days(history: list[WorkoutHistoryEntry], days: int) -> list[WorkoutHistoryEntry]:
    if not history:
        return []
    ordered = sorted(history, key=lambda h: h.date)
    latest = ordered[-1].date
    return [item for item in ordered if (latest - item.date).days <= days]
