# services/equipment_manager.py
from __future__ import annotations

from workout_tracker.core.models import ExerciseDefinition


def detect_available_equipment(user_equipment: list[str]) -> set[str]:
    """Normalize user equipment inventory."""
    return {item.strip().lower() for item in user_equipment if item.strip()}


def filter_exercises_by_equipment(
    exercises: list[ExerciseDefinition],
    available_equipment: set[str],
) -> list[ExerciseDefinition]:
    """Return exercises the user can perform with available equipment."""
    allowed = set(available_equipment)
    allowed.update({"none", "bodyweight"})
    return [exercise for exercise in exercises if exercise.equipment.lower() in allowed]
