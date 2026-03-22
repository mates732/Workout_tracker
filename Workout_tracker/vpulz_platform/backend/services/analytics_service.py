from __future__ import annotations

from statistics import mean

from vpulz_platform.backend.models.entities import Workout


def estimate_1rm(weight: float, reps: int) -> float:
    return round(weight * (1 + reps / 30), 2)


class AnalyticsService:
    def progress_snapshot(self, workouts: list[Workout]) -> dict:
        if not workouts:
            return {
                "estimated_1rm": 0.0,
                "total_volume": 0.0,
                "consistency_score": 0.0,
                "exercise_frequency": 0,
            }

        volumes = [w.total_volume for w in workouts]
        one_rms = [
            max((estimate_1rm(s.weight, s.reps) for ex in w.exercises for s in ex.sets), default=0)
            for w in workouts
        ]
        exercise_frequency = sum(len(w.exercises) for w in workouts)

        return {
            "estimated_1rm": max(one_rms),
            "total_volume": round(sum(volumes), 2),
            "consistency_score": round(min(100.0, len(workouts) * 4.0), 2),
            "exercise_frequency": exercise_frequency,
        }

    def fatigue_score(self, workouts: list[Workout]) -> float:
        if not workouts:
            return 0.0
        recent = workouts[-7:]
        avg_volume = mean(w.total_volume for w in recent)
        missed_rep_proxy = sum(1 for w in recent for ex in w.exercises for s in ex.sets if s.rpe >= 9.5)
        decline_proxy = 1 if len(recent) >= 2 and recent[-1].total_volume < recent[-2].total_volume else 0
        score = min(100.0, (avg_volume / 200.0) + (missed_rep_proxy * 3) + (decline_proxy * 12))
        return round(score, 2)

    def strength_score(self, workouts: list[Workout]) -> int:
        snapshot = self.progress_snapshot(workouts)
        score = (snapshot["estimated_1rm"] * 2.2) + (snapshot["total_volume"] / 120) + (snapshot["consistency_score"] * 2)
        return int(round(score))
