# services/readiness.py
from __future__ import annotations


def calculate_readiness(
    sleep_hours: float,
    fatigue_score: float,
    previous_workout_load: float,
    resting_hr: float | None = None,
) -> int:
    """Calculate a daily readiness score on a 0-100 scale.

    Inputs are normalized into penalties/bonuses for sleep, fatigue,
    prior-day training load, and optionally resting heart rate.
    """
    if sleep_hours < 0:
        raise ValueError("sleep_hours must be non-negative")
    if fatigue_score < 0:
        raise ValueError("fatigue_score must be non-negative")
    if previous_workout_load < 0:
        raise ValueError("previous_workout_load must be non-negative")
    if resting_hr is not None and resting_hr <= 0:
        raise ValueError("resting_hr must be positive when provided")

    score = 100.0

    # Sleep contribution
    if sleep_hours < 5:
        score -= 30
    elif sleep_hours < 6:
        score -= 18
    elif sleep_hours < 7:
        score -= 10
    elif sleep_hours <= 9:
        score -= 0
    else:
        score -= 5

    # Fatigue contribution (assumes 0-10 common fatigue scale)
    fatigue_penalty = min(35.0, fatigue_score * 3.5)
    score -= fatigue_penalty

    # Prior load contribution
    if previous_workout_load >= 12000:
        score -= 18
    elif previous_workout_load >= 9000:
        score -= 12
    elif previous_workout_load >= 6000:
        score -= 7
    elif previous_workout_load >= 3000:
        score -= 3

    # Resting HR contribution
    if resting_hr is not None:
        if resting_hr >= 75:
            score -= 12
        elif resting_hr >= 68:
            score -= 7
        elif resting_hr >= 62:
            score -= 3

    return int(max(0, min(100, round(score))))
