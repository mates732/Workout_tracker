from __future__ import annotations

import json

from vpulz_platform.backend.models.entities import AssistantContextSnapshot, Routine, UserProfile, Workout


def build_context(
    profile: UserProfile,
    workouts: list[Workout],
    routines: list[Routine],
    fatigue_score: float,
    snapshot: AssistantContextSnapshot | None = None,
) -> str:
    recent_workouts = sorted(workouts, key=lambda workout: workout.started_at, reverse=True)[:3]
    recent_workout_summaries = [
        {
            "workout_id": workout.workout_id,
            "started_at": workout.started_at.isoformat(),
            "ended": workout.ended_at is not None,
            "exercise_count": len(workout.exercises),
            "total_volume": workout.total_volume,
            "exercises": [exercise.exercise_name for exercise in workout.exercises],
        }
        for workout in recent_workouts
    ]

    routine_summaries = [
        {"name": routine.name, "split": routine.split, "exercises": routine.exercises[:8]}
        for routine in routines[:3]
    ]

    payload = {
        "profile": {
            "user_id": profile.user_id,
            "goal": profile.goal,
            "level": profile.level,
            "equipment": profile.equipment,
            "age": profile.age,
            "height_cm": profile.height_cm,
            "weight_kg": profile.weight_kg,
            "training_days_per_week": profile.training_days_per_week,
            "injuries": profile.injuries,
            "limitations": profile.limitations,
            "preferred_split": profile.preferred_split,
            "notes": profile.notes,
        },
        "fatigue_score": fatigue_score,
        "recent_workouts": recent_workout_summaries,
        "routines": routine_summaries,
    }

    if snapshot is not None:
        payload["snapshot"] = {
            "active_workout_id": snapshot.active_workout_id,
            "active_workout_exercises": snapshot.active_workout_exercises,
            "recent_workout_count": snapshot.recent_workout_count,
            "routine_count": snapshot.routine_count,
            "estimated_1rm": snapshot.estimated_1rm,
            "total_volume": snapshot.total_volume,
            "consistency_score": snapshot.consistency_score,
            "strength_score": snapshot.strength_score,
            "response_profile": snapshot.response_profile,
            "training_timeline": snapshot.training_timeline,
            "recent_exercises": snapshot.recent_exercises,
        }

    return json.dumps(payload, default=str)
