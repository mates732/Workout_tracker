"""Backward-compatible entry point for workout session engine."""

from workout_tracker.core.models import ExerciseDefinition, ExerciseType, SetLog, WorkoutHistoryEntry
from workout_tracker.services.workout_session import WorkoutSessionService as WorkoutEngine

__all__ = [
    "ExerciseDefinition",
    "ExerciseType",
    "SetLog",
    "WorkoutHistoryEntry",
    "WorkoutEngine",
]
