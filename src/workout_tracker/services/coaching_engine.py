# services/coaching_engine.py
from __future__ import annotations

from workout_tracker.services.readiness import calculate_readiness


def generate_coaching_tip(readiness_score: int, trend: str, fatigue_score: float) -> str:
    """Generate an actionable coaching recommendation."""
    if readiness_score < 0 or readiness_score > 100:
        raise ValueError("readiness_score must be in 0..100")
    trend_n = trend.lower().strip()

    if readiness_score < 45 or fatigue_score >= 8:
        return "Recovery-focused day: reduce load 20%, prioritize sleep and mobility."
    if trend_n == "increasing" and readiness_score >= 70:
        return "Great adaptation: add 2.5% load and keep technique strict."
    if trend_n == "plateau":
        return "Progress has stalled: vary rep range and add an extra rest day if needed."
    return "Maintain consistent execution and monitor RPE for auto-regulation."


def daily_coaching_brief(
    sleep_hours: float,
    fatigue_score: float,
    previous_workout_load: float,
    resting_hr: float | None,
    progression_trend: str,
) -> dict[str, str | int]:
    """Produce readiness score and headline coaching tip."""
    readiness = calculate_readiness(sleep_hours, fatigue_score, previous_workout_load, resting_hr)
    tip = generate_coaching_tip(readiness, progression_trend, fatigue_score)
    return {"readiness": readiness, "tip": tip}
