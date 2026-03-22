# services/exercise_intelligence.py
from __future__ import annotations

from workout_tracker.core.models import ExerciseDefinition


def classify_exercise_stimulus(exercise: ExerciseDefinition) -> dict[str, str]:
    """Return a compact stimulus profile for an exercise."""
    if not exercise.name.strip():
        raise ValueError("exercise.name cannot be empty")
    return {
        "exercise": exercise.name,
        "movement_pattern": exercise.movement_pattern,
        "primary_focus": exercise.target_muscles[0] if exercise.target_muscles else "general",
        "category": exercise.category,
    }


def suggest_execution_cues(exercise: ExerciseDefinition) -> list[str]:
    """Return generic but useful execution cues."""
    pattern = exercise.movement_pattern.lower()
    cues = ["Brace core", "Control eccentric", "Use full range of motion"]
    if "push" in pattern:
        cues.append("Stack wrists over elbows")
    if "hinge" in pattern:
        cues.append("Keep neutral spine")
    if "squat" in pattern:
        cues.append("Drive knees over toes")
    return cues
