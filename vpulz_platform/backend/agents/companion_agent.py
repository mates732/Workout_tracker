from __future__ import annotations


def realtime_set_feedback(last_set_rpe: float, completed_reps: int, target_reps: int) -> str:
    if last_set_rpe <= 7.5 and completed_reps >= target_reps:
        return "Set looked strong. Consider +2.5kg next set."
    if last_set_rpe >= 9.5 or completed_reps < target_reps - 1:
        return "Fatigue detected. Keep weight or reduce 2.5-5kg."
    return "Good effort. Repeat weight and match target reps."
