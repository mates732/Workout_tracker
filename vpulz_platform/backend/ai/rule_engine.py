from __future__ import annotations


def rule_based_answer(question: str, fatigue_score: float) -> str | None:
    q = question.lower()
    if "deload" in q and fatigue_score >= 70:
        return "Yes—fatigue is elevated. Run a deload week with ~30% less volume."
    if "what should i train today" in q and fatigue_score < 60:
        return "Train your next planned strength day and target compound lifts first."
    return None
