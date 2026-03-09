# services/notifications.py
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta


@dataclass(frozen=True)
class Notification:
    title: str
    message: str
    send_at: datetime


def workout_reminder(next_workout_at: datetime) -> Notification:
    return Notification("Workout Reminder", "Time for your planned session.", next_workout_at)


def recovery_reminder(recovery_hours: float) -> Notification:
    send_at = datetime.utcnow() + timedelta(hours=max(1.0, recovery_hours))
    return Notification("Recovery Check-in", "You're likely recovered; reassess readiness.", send_at)


def goal_milestone_notification(goal_name: str, milestone: str) -> Notification:
    return Notification("Goal Milestone", f"{goal_name}: reached {milestone}", datetime.utcnow())
