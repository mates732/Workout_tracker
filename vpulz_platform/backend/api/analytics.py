from __future__ import annotations

from fastapi import APIRouter

from vpulz_platform.backend.database.repositories import WorkoutRepository
from vpulz_platform.backend.services.analytics_service import AnalyticsService
from vpulz_platform.backend.services.prediction_service import PredictionService

router = APIRouter(prefix="/analytics", tags=["analytics"])
workout_repo = WorkoutRepository()
analytics = AnalyticsService()
predictor = PredictionService()


@router.get("/progress/{user_id}")
def progress(user_id: str) -> dict:
    workouts = workout_repo.by_user(user_id)
    snapshot = analytics.progress_snapshot(workouts)
    predictions = predictor.predict_strength_progress(workouts)
    return {"snapshot": snapshot, "predictions": predictions}


@router.get("/strength-score/{user_id}")
def strength_score(user_id: str) -> dict:
    workouts = workout_repo.by_user(user_id)
    return {"strength_score": analytics.strength_score(workouts)}
