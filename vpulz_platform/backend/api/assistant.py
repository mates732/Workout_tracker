from __future__ import annotations

from fastapi import APIRouter

from vpulz_platform.backend.core.container import container
from vpulz_platform.backend.models.entities import AssistantContextSnapshot
from vpulz_platform.backend.schemas.api import AssistantQueryRequest

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.post("/ask")
def ask_assistant(payload: AssistantQueryRequest) -> dict:
    profile = container.profile_service.get_profile(payload.user_id)
    workouts = container.workout_repo.by_user(payload.user_id)
    routines = container.routine_repo.by_user(payload.user_id)
    active_workout = None
    if payload.active_workout_id:
        try:
            candidate = container.workout_repo.get(payload.active_workout_id)
            if candidate.user_id == payload.user_id:
                active_workout = candidate
        except KeyError:
            active_workout = None
    if active_workout is None:
        active_workout = container.workout_repo.active_by_user(payload.user_id)

    fatigue = container.analytics.fatigue_score(workouts)
    progress = container.analytics.progress_snapshot(workouts)
    response_profile = container.predictor.training_dna(workouts)
    timeline = container.recommendations.training_timeline(workouts)
    recent_exercises = [
        exercise.exercise_name
        for workout in sorted(workouts, key=lambda item: item.started_at, reverse=True)[:5]
        for exercise in workout.exercises
    ][:12]

    snapshot = AssistantContextSnapshot(
        profile=profile,
        fatigue_score=fatigue,
        active_workout_id=active_workout.workout_id if active_workout else None,
        active_workout_exercises=[exercise.exercise_name for exercise in active_workout.exercises] if active_workout else [],
        recent_workout_count=len(workouts),
        routine_count=len(routines),
        estimated_1rm=float(progress["estimated_1rm"]),
        total_volume=float(progress["total_volume"]),
        consistency_score=float(progress["consistency_score"]),
        strength_score=container.analytics.strength_score(workouts),
        response_profile=response_profile.get("response_profile", "insufficient_data"),
        training_timeline=timeline,
        recent_exercises=recent_exercises,
    )

    answer = container.coach.respond(payload.question, profile, workouts, routines, fatigue, snapshot=snapshot)
    return {
        "answer": answer,
        "fatigue_score": fatigue,
        "context": {
            "goal": profile.goal,
            "level": profile.level,
            "equipment": profile.equipment,
            "injuries": profile.injuries,
            "limitations": profile.limitations,
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
        },
    }
