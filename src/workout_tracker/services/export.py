# services/export.py
from __future__ import annotations

import csv
import json
from io import StringIO

from workout_tracker.core.models import WorkoutHistoryEntry


def export_workouts_json(history: list[WorkoutHistoryEntry]) -> str:
    """Export workout history to JSON string."""
    payload = []
    for workout in history:
        payload.append(
            {
                "date": workout.date.isoformat(),
                "duration_minutes": workout.duration_minutes,
                "total_sets": workout.total_sets,
                "total_volume": workout.total_volume,
            }
        )
    return json.dumps(payload, indent=2)


def export_workouts_csv(history: list[WorkoutHistoryEntry]) -> str:
    """Export workout history to CSV string."""
    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=["date", "duration_minutes", "total_sets", "total_volume"])
    writer.writeheader()
    for workout in history:
        writer.writerow(
            {
                "date": workout.date.isoformat(),
                "duration_minutes": workout.duration_minutes,
                "total_sets": workout.total_sets,
                "total_volume": round(workout.total_volume, 2),
            }
        )
    return output.getvalue()


def generate_progress_report(history: list[WorkoutHistoryEntry]) -> str:
    """Generate a concise plain-text progress report."""
    if not history:
        return "No workouts recorded yet."
    total_sessions = len(history)
    total_volume = sum(item.total_volume for item in history)
    avg_duration = sum(item.duration_minutes for item in history) / total_sessions
    return (
        f"Sessions: {total_sessions}\n"
        f"Total volume: {total_volume:.1f} kg\n"
        f"Average duration: {avg_duration:.1f} min"
    )
