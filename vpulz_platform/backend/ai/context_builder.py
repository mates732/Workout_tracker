from __future__ import annotations

from vpulz_platform.backend.models.entities import Routine, UserProfile, Workout


def build_context(profile: UserProfile, workouts: list[Workout], routines: list[Routine], fatigue_score: float) -> str:
    return (
        f"goal={profile.goal}; level={profile.level}; equipment={profile.equipment}; "
        f"workouts={len(workouts)}; routines={len(routines)}; fatigue={fatigue_score}"
    )
