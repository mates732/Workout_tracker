# services/mobility.py
from __future__ import annotations


def mobility_recommendations(target_muscles: list[str], fatigue_scores: dict[str, float]) -> list[str]:
    """Generate mobility suggestions based on target muscles and fatigue."""
    recs: list[str] = []
    for muscle in target_muscles:
        score = fatigue_scores.get(muscle, 0)
        if muscle == "hips" or muscle == "legs":
            recs.append("90/90 hip flow 2x45s")
        if muscle == "back":
            recs.append("Thoracic rotations 2x10")
        if muscle == "shoulders":
            recs.append("Band shoulder dislocates 2x15")
        if score >= 7:
            recs.append(f"Extra mobility block for {muscle}: 8-10 minutes")
    return list(dict.fromkeys(recs))
