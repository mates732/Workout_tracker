from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import List


@dataclass
class CalendarEvent:
    event_date: date
    event_type: str
    label: str


class CalendarPlanningService:
    def build_month_plan(self, workout_days: List[date], phase_label: str) -> List[CalendarEvent]:
        events = [CalendarEvent(day, "workout", "Planned Workout") for day in workout_days]
        if workout_days:
            events.append(CalendarEvent(workout_days[0], "phase", phase_label))
        return sorted(events, key=lambda e: e.event_date)
