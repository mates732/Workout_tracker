# services/habits.py
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class HabitStatus:
    name: str
    target_per_week: int
    completed_this_week: int = 0


def track_habit_completion(habit: HabitStatus, completed: bool) -> HabitStatus:
    """Increment weekly completion count for a habit."""
    if completed:
        habit.completed_this_week += 1
    return habit


def habit_completion_rate(habit: HabitStatus) -> float:
    """Return completion rate in [0, 1]."""
    if habit.target_per_week <= 0:
        raise ValueError("target_per_week must be positive")
    return min(1.0, habit.completed_this_week / habit.target_per_week)


def habit_feedback(habit: HabitStatus) -> str:
    """Return coaching feedback for habit adherence."""
    rate = habit_completion_rate(habit)
    if rate >= 0.9:
        return f"Excellent consistency on {habit.name}."
    if rate >= 0.6:
        return f"Solid progress on {habit.name}; keep momentum."
    return f"Focus on improving {habit.name} consistency this week."
