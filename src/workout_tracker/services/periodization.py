# services/periodization.py
from __future__ import annotations

from statistics import mean
from typing import Literal

from workout_tracker.core.models import WorkoutHistoryEntry

BlockType = Literal["hypertrophy", "strength", "endurance"]


def generate_training_block(goal: str, experience: str) -> dict[str, int | str]:
    """Generate a block prescription from goal and experience.

    Args:
        goal: User goal (e.g., muscle_gain, strength, fat_loss).
        experience: beginner/intermediate/advanced.
    """
    goal_n = goal.strip().lower()
    experience_n = experience.strip().lower()
    if not goal_n:
        raise ValueError("goal cannot be empty")
    if experience_n not in {"beginner", "intermediate", "advanced"}:
        raise ValueError("experience must be beginner, intermediate, or advanced")

    if goal_n in {"strength", "power"}:
        block_type: BlockType = "strength"
    elif goal_n in {"fat_loss", "endurance", "general_fitness"}:
        block_type = "endurance"
    else:
        block_type = "hypertrophy"

    duration_map = {
        "beginner": 4,
        "intermediate": 6,
        "advanced": 8,
    }
    volume_base = {
        "hypertrophy": 16,
        "strength": 12,
        "endurance": 14,
    }
    experience_delta = {"beginner": -2, "intermediate": 0, "advanced": 2}

    duration_weeks = duration_map[experience_n]
    weekly_volume_target = max(8, volume_base[block_type] + experience_delta[experience_n])

    return {
        "block_type": block_type,
        "duration_weeks": duration_weeks,
        "weekly_volume_target": weekly_volume_target,
    }


def detect_block_end(workout_history: list[WorkoutHistoryEntry]) -> bool:
    """Detect likely block completion based on elapsed sessions and trend flattening."""
    if len(workout_history) < 4:
        return False

    ordered = sorted(workout_history, key=lambda item: item.date)
    if (ordered[-1].date - ordered[0].date).days < 28:
        return False

    recent = ordered[-4:]
    volumes = [item.total_volume for item in recent]
    spread = max(volumes) - min(volumes)
    baseline = mean(volumes)
    return baseline > 0 and (spread / baseline) <= 0.05


def recommend_deload_week(fatigue_scores: dict[str, float], progression_trend: str) -> bool:
    """Recommend deload week from fatigue burden and progression signal."""
    if progression_trend.strip().lower() == "decreasing":
        return True
    if progression_trend.strip().lower() == "plateau" and any(score >= 8.0 for score in fatigue_scores.values()):
        return True
    return any(score >= 9.0 for score in fatigue_scores.values())
