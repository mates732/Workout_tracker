# ui/components.py
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class UIComponent:
    name: str
    title: str
    description: str
    layout: str


def workout_card() -> UIComponent:
    return UIComponent("workout_card", "Workout Card", "Displays planned workout summary, duration, and CTA.", "card")


def exercise_card() -> UIComponent:
    return UIComponent("exercise_card", "Exercise Card", "Shows sets/reps/weight/RPE and quick actions.", "card")


def workout_session_screen() -> UIComponent:
    return UIComponent("workout_session", "Workout Session", "Live logging screen with rest timer and quick log controls.", "screen")


def progress_charts() -> UIComponent:
    return UIComponent("progress_charts", "Progress Charts", "Renders strength, volume, and body metric trends.", "chart_grid")


def goal_tracker() -> UIComponent:
    return UIComponent("goal_tracker", "Goal Tracker", "Tracks milestones and completion ETA.", "panel")


def calendar_component() -> UIComponent:
    return UIComponent("calendar", "Calendar", "Monthly training plan with phase overlays.", "calendar")


def pr_badges() -> UIComponent:
    return UIComponent("pr_badges", "PR Badges", "Displays newly unlocked personal records.", "badge_row")


def dashboard() -> UIComponent:
    return UIComponent("dashboard", "Dashboard", "High-level overview of readiness, streak, and today's workout.", "screen")
