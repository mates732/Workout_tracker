# services/exercise_substitution.py
from __future__ import annotations

from dataclasses import replace

from workout_tracker.core.models import ExerciseDefinition, GeneratedWorkout, WorkoutPrescription


_DIFFICULTY_ORDER = {"beginner": 0, "intermediate": 1, "advanced": 2}


def find_alternative(
    exercise: ExerciseDefinition,
    exercise_pool: list[ExerciseDefinition],
    equipment_available: list[str],
) -> ExerciseDefinition:
    """Find the best substitute for an unavailable exercise.

    Selection priority:
    1) same primary muscle
    2) same movement pattern
    3) compatible equipment
    4) closest difficulty
    """
    if not exercise_pool:
        raise ValueError("exercise_pool cannot be empty")

    available = {item.lower() for item in equipment_available}
    primary = exercise.target_muscles[0] if exercise.target_muscles else None
    target_difficulty = _DIFFICULTY_ORDER.get(exercise.difficulty.lower(), 1)

    candidates: list[ExerciseDefinition] = []
    for candidate in exercise_pool:
        candidate_primary = candidate.target_muscles[0] if candidate.target_muscles else None
        equipment_ok = (
            candidate.equipment.lower() in available
            or candidate.equipment.lower() in {"none", "bodyweight"}
        )
        if candidate_primary != primary:
            continue
        if candidate.movement_pattern != exercise.movement_pattern:
            continue
        if not equipment_ok:
            continue
        candidates.append(candidate)

    if not candidates:
        # fallback: compatible equipment only
        candidates = [
            c
            for c in exercise_pool
            if c.equipment.lower() in available or c.equipment.lower() in {"none", "bodyweight"}
        ]

    if not candidates:
        return exercise

    def rank(candidate: ExerciseDefinition) -> tuple[int, int]:
        diff = abs(_DIFFICULTY_ORDER.get(candidate.difficulty.lower(), 1) - target_difficulty)
        same_pattern_bonus = 0 if candidate.movement_pattern == exercise.movement_pattern else 1
        return (same_pattern_bonus, diff)

    return sorted(candidates, key=rank)[0]


def replace_if_unavailable(
    workout: GeneratedWorkout,
    exercise_pool: list[ExerciseDefinition],
    equipment_available: list[str],
) -> GeneratedWorkout:
    """Replace unsupported-equipment exercises while preserving prescription fields."""
    available = {item.lower() for item in equipment_available}
    updated: list[WorkoutPrescription] = []

    for prescription in workout.exercises:
        original = prescription.exercise
        needs_replacement = (
            original.equipment.lower() not in available
            and original.equipment.lower() not in {"none", "bodyweight"}
        )

        if needs_replacement:
            replacement = find_alternative(original, exercise_pool, equipment_available)
            updated.append(replace(prescription, exercise=replacement))
        else:
            updated.append(prescription)

    return replace(workout, exercises=updated)
