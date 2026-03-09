# services/gamification.py
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class GamificationProfile:
    xp: int = 0
    level: int = 1
    streak_days: int = 0


def award_xp(profile: GamificationProfile, workout_quality: int) -> GamificationProfile:
    """Award XP based on workout quality and update level."""
    if not 0 <= workout_quality <= 100:
        raise ValueError("workout_quality must be between 0 and 100")
    gained = 20 + int(workout_quality * 0.8)
    profile.xp += gained
    profile.level = 1 + profile.xp // 500
    return profile


def update_streak(profile: GamificationProfile, trained_today: bool) -> GamificationProfile:
    """Update current training streak."""
    profile.streak_days = profile.streak_days + 1 if trained_today else 0
    return profile


def achievement_badges(profile: GamificationProfile) -> list[str]:
    """Return earned badge labels based on XP/level/streak."""
    badges: list[str] = []
    if profile.streak_days >= 7:
        badges.append("7-day streak")
    if profile.streak_days >= 30:
        badges.append("30-day streak")
    if profile.level >= 5:
        badges.append("Rising Athlete")
    if profile.level >= 10:
        badges.append("Elite Consistency")
    return badges
