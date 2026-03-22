# services/personal_records.py
from __future__ import annotations

from workout_tracker.core.models import SetLog, WorkoutHistoryEntry
from workout_tracker.services.progression import calculate_estimated_1rm


def detect_personal_records(
    exercise_name: str,
    set_logs: list[SetLog],
    history: list[WorkoutHistoryEntry],
) -> list[str]:
    """Detect advanced PR categories for a specific exercise session.

    Categories:
    - 1RM PR
    - Volume PR
    - Rep PR
    - Density PR (volume per minute)
    """
    if not exercise_name.strip():
        raise ValueError("exercise_name cannot be empty")
    if not set_logs:
        return []

    current_best_1rm = max(calculate_estimated_1rm(log.weight_kg, max(1, log.reps)) for log in set_logs)
    current_volume = sum(log.volume for log in set_logs)
    current_reps = max(log.reps for log in set_logs)

    current_duration = max(1, _latest_duration_for_exercise(set_logs, history, exercise_name))
    current_density = current_volume / current_duration

    baseline_1rm, baseline_volume, baseline_reps, baseline_density = _historical_baselines(exercise_name, history)

    messages: list[str] = []
    if current_best_1rm > baseline_1rm:
        messages.append(f"1RM PR: {exercise_name} {current_best_1rm:.1f}")
    if current_volume > baseline_volume:
        messages.append(f"Volume PR: {exercise_name} {current_volume:.1f}")
    if current_reps > baseline_reps:
        messages.append(f"Rep PR: {exercise_name} {current_reps}")
    if current_density > baseline_density:
        messages.append(f"Density PR: {exercise_name} {current_density:.2f}")

    return messages


def _historical_baselines(exercise_name: str, history: list[WorkoutHistoryEntry]) -> tuple[float, float, int, float]:
    best_1rm = 0.0
    best_volume = 0.0
    best_reps = 0
    best_density = 0.0

    for session in history:
        logs = session.exercises.get(exercise_name, [])
        if not logs:
            continue
        best_1rm = max(best_1rm, max(calculate_estimated_1rm(log.weight_kg, max(1, log.reps)) for log in logs))
        volume = sum(log.volume for log in logs)
        best_volume = max(best_volume, volume)
        best_reps = max(best_reps, max(log.reps for log in logs))
        duration = max(1, session.duration_minutes)
        best_density = max(best_density, volume / duration)

    return best_1rm, best_volume, best_reps, best_density


def _latest_duration_for_exercise(
    set_logs: list[SetLog],
    history: list[WorkoutHistoryEntry],
    exercise_name: str,
) -> int:
    # Derive a proxy duration from latest matching session; fallback to default.
    sessions = sorted(history, key=lambda item: item.date)
    for session in reversed(sessions):
        if exercise_name in session.exercises and session.exercises[exercise_name] == set_logs:
            return session.duration_minutes
    return 30
