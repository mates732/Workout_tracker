from __future__ import annotations

from statistics import mean

from vpulz.backend.models.domain import Workout


def estimated_1rm(weight: float, reps: int) -> float:
    return round(weight * (1 + reps / 30), 2)


class ProgressService:
    def analyze(self, workouts: list[Workout]) -> dict:
        if not workouts:
            return {"volume_change_pct": 0.0, "strength_change_pct": 0.0, "consistency": 0}

        ordered = sorted(workouts, key=lambda w: w.started_at)
        recent = ordered[-2:]
        volumes = [w.total_volume for w in recent]
        volume_change_pct = 0.0 if len(volumes) < 2 or volumes[0] == 0 else round(((volumes[1] - volumes[0]) / volumes[0]) * 100, 2)

        def best_1rm(workout: Workout) -> float:
            vals = [estimated_1rm(s.weight, s.reps) for ex in workout.exercises for s in ex.sets]
            return max(vals) if vals else 0.0

        strengths = [best_1rm(w) for w in recent]
        strength_change_pct = 0.0 if len(strengths) < 2 or strengths[0] == 0 else round(((strengths[1] - strengths[0]) / strengths[0]) * 100, 2)

        return {
            "volume_change_pct": volume_change_pct,
            "strength_change_pct": strength_change_pct,
            "consistency": len(workouts),
        }

    def recommend_next_weight(self, previous_weight: float, previous_rpe: float, progression_trend: str) -> float:
        if progression_trend == "increasing" and previous_rpe <= 8:
            return round(previous_weight * 1.025, 2)
        if progression_trend == "decreasing" or previous_rpe >= 9.5:
            return round(previous_weight * 0.95, 2)
        return round(previous_weight * 1.01, 2)
