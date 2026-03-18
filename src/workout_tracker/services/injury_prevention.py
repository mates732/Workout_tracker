# services/injury_prevention.py
from __future__ import annotations

from statistics import mean


def detect_overuse(muscle_history: dict[str, list[float]]) -> list[str]:
    """Detect muscles with excessive weekly load.

    A muscle is flagged when its latest week load is significantly above its own
    moving average and above a practical absolute threshold.
    """
    overused: list[str] = []

    for muscle, loads in muscle_history.items():
        if not loads:
            continue
        latest = loads[-1]
        baseline = mean(loads[-4:]) if len(loads) >= 4 else mean(loads)
        if latest >= 1.25 * baseline and latest >= 1800:
            overused.append(muscle)

    return overused


def recommend_recovery_adjustments(fatigue_scores: dict[str, float]) -> dict[str, list[str] | int]:
    """Recommend targeted recovery adjustments from muscle-specific fatigue scores."""
    if not fatigue_scores:
        return {"reduce_volume": [], "rest_days": 0}

    reduce_volume = [muscle for muscle, score in fatigue_scores.items() if score >= 7.0]

    if any(score >= 9.0 for score in fatigue_scores.values()):
        rest_days = 2
    elif any(score >= 7.0 for score in fatigue_scores.values()):
        rest_days = 1
    else:
        rest_days = 0

    return {
        "reduce_volume": reduce_volume,
        "rest_days": rest_days,
    }
