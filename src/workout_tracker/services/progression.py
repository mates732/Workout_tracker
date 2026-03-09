# services/progression.py
from __future__ import annotations

from statistics import mean
from typing import Any

from workout_tracker.core.models import SetLog, WorkoutHistoryEntry


def calculate_estimated_1rm(weight: float, reps: int) -> float:
    """Estimate one-repetition maximum using the Epley formula.

    Args:
        weight: Lifted load in kilograms. Must be non-negative.
        reps: Repetition count. Must be positive.

    Returns:
        Estimated 1RM rounded to two decimals.
    """
    if weight < 0:
        raise ValueError("weight must be non-negative")
    if reps <= 0:
        raise ValueError("reps must be positive")
    return round(weight * (1 + reps / 30), 2)


def generate_progression_plan(exercise_history: list[WorkoutHistoryEntry]) -> dict[str, Any]:
    """Build progression recommendations from the latest sessions.

    The function analyzes up to the last six workout history entries and uses
    average volume and best estimated 1RM trends to produce a practical next step.
    """
    sessions = _recent_sessions(exercise_history, limit=6)
    if not sessions:
        return {
            "trend": "plateau",
            "next_weight": 0.0,
            "recommended_sets": 3,
            "recommended_reps": (8, 12),
        }

    volume_trend = _session_volumes(sessions)
    one_rm_trend = _session_best_1rms(sessions)
    trend = _classify_trend(volume_trend, one_rm_trend)

    last_weight = _latest_weight(sessions)
    if trend == "increasing":
        next_weight = round(last_weight * 1.025, 2)
        recommended_sets = 4
        recommended_reps = (5, 8)
    elif trend == "decreasing":
        next_weight = round(last_weight * 0.95, 2)
        recommended_sets = 3
        recommended_reps = (6, 10)
    else:
        next_weight = round(last_weight * 1.01, 2)
        recommended_sets = 3
        recommended_reps = (6, 10)

    return {
        "trend": trend,
        "next_weight": max(0.0, next_weight),
        "recommended_sets": recommended_sets,
        "recommended_reps": recommended_reps,
    }


def detect_plateau(exercise_history: list[WorkoutHistoryEntry]) -> bool:
    """Return True when recent sessions indicate a plateau.

    Plateau rules:
    - estimated 1RM has not improved for 4+ sessions, OR
    - volume progression stagnates.
    """
    sessions = _recent_sessions(exercise_history, limit=6)
    if len(sessions) < 4:
        return False

    one_rms = _session_best_1rms(sessions)
    volumes = _session_volumes(sessions)

    no_1rm_increase = max(one_rms[-4:]) <= one_rms[-4] + 0.01
    recent_volumes = volumes[-4:]
    volume_spread = max(recent_volumes) - min(recent_volumes)
    avg_volume = mean(recent_volumes)
    volume_stagnant = avg_volume > 0 and (volume_spread / avg_volume) < 0.03

    return no_1rm_increase or volume_stagnant


def recommend_deload(exercise_history: list[WorkoutHistoryEntry]) -> bool:
    """Recommend deload when plateau and negative recovery/performance signals coexist."""
    sessions = _recent_sessions(exercise_history, limit=6)
    if len(sessions) < 4:
        return False

    if not detect_plateau(sessions):
        return False

    fatigue_high = _fatigue_trend_high(sessions)
    performance_decreasing = _performance_decreasing(sessions)
    return fatigue_high and performance_decreasing


def _recent_sessions(history: list[WorkoutHistoryEntry], limit: int) -> list[WorkoutHistoryEntry]:
    return sorted(history, key=lambda s: s.date)[-limit:]


def _iter_set_logs(session: WorkoutHistoryEntry) -> list[SetLog]:
    return [log for logs in session.exercises.values() for log in logs]


def _session_volumes(sessions: list[WorkoutHistoryEntry]) -> list[float]:
    return [session.total_volume for session in sessions]


def _session_best_1rms(sessions: list[WorkoutHistoryEntry]) -> list[float]:
    out: list[float] = []
    for session in sessions:
        logs = _iter_set_logs(session)
        if not logs:
            out.append(0.0)
            continue
        out.append(max(calculate_estimated_1rm(log.weight_kg, max(1, log.reps)) for log in logs))
    return out


def _latest_weight(sessions: list[WorkoutHistoryEntry]) -> float:
    for session in reversed(sessions):
        logs = _iter_set_logs(session)
        if logs:
            return logs[-1].weight_kg
    return 0.0


def _classify_trend(volumes: list[float], one_rms: list[float]) -> str:
    if len(volumes) < 2 or len(one_rms) < 2:
        return "plateau"

    volume_delta = volumes[-1] - volumes[0]
    one_rm_delta = one_rms[-1] - one_rms[0]

    if volume_delta > 0 and one_rm_delta > 0:
        return "increasing"
    if volume_delta < 0 and one_rm_delta < 0:
        return "decreasing"
    return "plateau"


def _fatigue_trend_high(sessions: list[WorkoutHistoryEntry]) -> bool:
    """Proxy fatigue score based on average RPE in the latest sessions."""
    latest = sessions[-3:]
    rpes: list[float] = []
    for session in latest:
        rpes.extend([log.rpe for log in _iter_set_logs(session)])
    return bool(rpes) and mean(rpes) >= 8.8


def _performance_decreasing(sessions: list[WorkoutHistoryEntry]) -> bool:
    one_rms = _session_best_1rms(sessions)
    if len(one_rms) < 3:
        return False
    return one_rms[-1] < one_rms[-2] < one_rms[-3]
