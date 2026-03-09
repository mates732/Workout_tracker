from __future__ import annotations

from vpulz_platform.backend.models.entities import Workout
from vpulz_platform.backend.services.analytics_service import estimate_1rm


class PredictionService:
    def predict_strength_progress(self, workouts: list[Workout]) -> dict[str, float]:
        if not workouts:
            return {"week_4": 0.0, "week_8": 0.0, "week_12": 0.0}

        latest_1rm = max(
            (estimate_1rm(s.weight, s.reps) for w in workouts for ex in w.exercises for s in ex.sets),
            default=0.0,
        )
        return {
            "week_4": round(latest_1rm * 1.03, 2),
            "week_8": round(latest_1rm * 1.06, 2),
            "week_12": round(latest_1rm * 1.09, 2),
        }

    def training_dna(self, workouts: list[Workout]) -> dict[str, str]:
        if not workouts:
            return {"response_profile": "insufficient_data"}
        avg_exercises = sum(len(w.exercises) for w in workouts) / len(workouts)
        high_rpe_sets = sum(1 for w in workouts for ex in w.exercises for s in ex.sets if s.rpe >= 9)
        if avg_exercises >= 5 and high_rpe_sets < 3:
            profile = "responds_to_moderate_volume"
        elif high_rpe_sets >= 3:
            profile = "responds_to_high_intensity"
        else:
            profile = "balanced_adaptation"
        return {"response_profile": profile}
