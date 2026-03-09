# services/recovery.py
from __future__ import annotations


_BASE_RECOVERY_HOURS = {
    "chest": 48.0,
    "back": 48.0,
    "legs": 72.0,
    "shoulders": 48.0,
    "arms": 30.0,
    "core": 24.0,
}


def estimate_muscle_recovery(muscle: str, fatigue_score: float) -> float:
    """Estimate recovery hours required for a muscle group.

    Args:
        muscle: Muscle group key.
        fatigue_score: Fatigue burden on 0-10+ scale.

    Returns:
        Recovery time in hours.
    """
    if not muscle.strip():
        raise ValueError("muscle cannot be empty")
    if fatigue_score < 0:
        raise ValueError("fatigue_score must be non-negative")

    base = _BASE_RECOVERY_HOURS.get(muscle.strip().lower(), 48.0)
    multiplier = 1.0 + min(1.0, fatigue_score / 10.0) * 0.5
    return round(base * multiplier, 1)


def suggest_next_training_day(fatigue_scores: dict[str, float]) -> int:
    """Recommend full rest days before next hard session."""
    if not fatigue_scores:
        return 0

    max_recovery = max(estimate_muscle_recovery(muscle, score) for muscle, score in fatigue_scores.items())
    if max_recovery <= 36:
        return 0
    if max_recovery <= 60:
        return 1
    return 2
