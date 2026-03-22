# services/goal_system.py
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date

from workout_tracker.core.models import WorkoutHistoryEntry


@dataclass
class UserGoal:
    """Represents a long-term fitness goal."""

    user_id: str
    goal_type: str
    target_value: float
    current_value: float = 0.0
    created_on: date = field(default_factory=date.today)


def create_goal(user_id: str, goal_type: str, target_value: float) -> UserGoal:
    """Create a validated user goal object."""
    if not user_id.strip():
        raise ValueError("user_id cannot be empty")
    if not goal_type.strip():
        raise ValueError("goal_type cannot be empty")
    if target_value <= 0:
        raise ValueError("target_value must be positive")
    return UserGoal(user_id=user_id, goal_type=goal_type, target_value=target_value)


def update_goal_progress(goal: UserGoal, workout_history: list[WorkoutHistoryEntry]) -> UserGoal:
    """Update goal progress from workout history-derived metrics."""
    if goal.goal_type in {"bench_press", "squat", "deadlift"}:
        goal.current_value = _best_weight_for_keyword(workout_history, goal.goal_type.replace("_", " "))
    elif goal.goal_type in {"first_pull_up", "pull_up"}:
        goal.current_value = 1.0 if _has_pull_up(workout_history) else 0.0
    elif goal.goal_type in {"lose_weight", "weight_loss"}:
        # placeholder: use negative trend proxy from total volume consistency
        goal.current_value = max(goal.current_value, _consistency_proxy(workout_history))
    else:
        goal.current_value = max(goal.current_value, _consistency_proxy(workout_history))

    return goal


def estimate_goal_completion(goal: UserGoal, progress_rate: float) -> int | None:
    """Estimate days to completion based on progress-per-day rate.

    Returns None when estimate is not feasible.
    """
    if progress_rate <= 0:
        return None
    remaining = max(0.0, goal.target_value - goal.current_value)
    return int(round(remaining / progress_rate))


def detect_goal_milestones(goal: UserGoal) -> list[str]:
    """Return milestone events based on completion percentage."""
    progress = 0.0 if goal.target_value <= 0 else (goal.current_value / goal.target_value) * 100
    milestones: list[str] = []

    if progress >= 25:
        milestones.append("25%")
    if progress >= 50:
        milestones.append("50%")
    if progress >= 75:
        milestones.append("75%")
    if progress >= 100:
        milestones.append("goal achieved")

    return milestones


def _best_weight_for_keyword(history: list[WorkoutHistoryEntry], keyword: str) -> float:
    key = keyword.lower()
    best = 0.0
    for session in history:
        for name, logs in session.exercises.items():
            if key in name.lower():
                for log in logs:
                    best = max(best, log.weight_kg)
    return round(best, 2)


def _has_pull_up(history: list[WorkoutHistoryEntry]) -> bool:
    for session in history:
        for name, logs in session.exercises.items():
            if "pull up" in name.lower() and any(log.reps >= 1 for log in logs):
                return True
    return False


def _consistency_proxy(history: list[WorkoutHistoryEntry]) -> float:
    return float(len(history))
