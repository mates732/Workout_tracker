# services/workout_quality.py
from __future__ import annotations


def score_workout(completion_ratio: float, avg_rpe: float, rest_adherence: float) -> int:
    """Score workout quality on a 0-100 scale.

    Args:
        completion_ratio: Fraction of planned work completed (0-1+).
        avg_rpe: Session average exertion (1-10 typical scale).
        rest_adherence: Fraction of planned rest timing adherence (0-1+).
    """
    if completion_ratio < 0:
        raise ValueError("completion_ratio must be non-negative")
    if avg_rpe <= 0:
        raise ValueError("avg_rpe must be positive")
    if rest_adherence < 0:
        raise ValueError("rest_adherence must be non-negative")

    completion_score = min(1.0, completion_ratio) * 55

    # Best quality zone is moderate-hard effort around RPE 7.5-8.5.
    rpe_distance = abs(avg_rpe - 8.0)
    rpe_score = max(0.0, 30 - (rpe_distance * 6))

    rest_score = min(1.0, rest_adherence) * 15

    return int(max(0, min(100, round(completion_score + rpe_score + rest_score))))
