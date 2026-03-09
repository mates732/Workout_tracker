from __future__ import annotations

from fastapi import APIRouter

from vpulz_platform.backend.core.container import container

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/progress/{user_id}")
def progress(user_id: str) -> dict:
    workouts = container.workout_repo.by_user(user_id)
    snapshot = container.analytics.progress_snapshot(workouts)
    predictions = container.predictor.predict_strength_progress(workouts)
    dna = container.predictor.training_dna(workouts)
    timeline = container.recommendations.training_timeline(workouts)
    return {"snapshot": snapshot, "predictions": predictions, "training_dna": dna, "timeline": timeline}


@router.get("/strength-score/{user_id}")
def strength_score(user_id: str) -> dict:
    workouts = container.workout_repo.by_user(user_id)
    return {"strength_score": container.analytics.strength_score(workouts)}


@router.get("/warmup")
def warmup(target_weight: float) -> dict:
    return {"warmup_sets": container.recommendations.generate_warmup_sets(target_weight)}
