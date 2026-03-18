from __future__ import annotations

from vpulz_platform.backend.models.entities import SetEntry, UserProfile, Workout


class RecommendationService:
    def generate_workout_plan(self, profile: UserProfile, fatigue_score: float) -> dict:
        base = {
            "strength": ["Bench Press", "Squat", "Deadlift", "Row"],
            "hypertrophy": ["Incline DB Press", "Lat Pulldown", "Leg Press", "Lateral Raise"],
        }.get(profile.goal, ["Push Up", "Goblet Squat", "Row", "Plank"])

        if fatigue_score >= 70:
            intensity = "light"
            base = base[:3]
        elif fatigue_score >= 45:
            intensity = "moderate"
        else:
            intensity = "hard"

        return {"intensity": intensity, "exercises": base}

    def recommend_next_weight(self, last_weight: float, reps_achieved: int, target_reps: int) -> float:
        if reps_achieved >= target_reps:
            return round(last_weight + 2.5, 2)
        if reps_achieved <= target_reps - 2:
            return round(max(0.0, last_weight * 0.95), 2)
        return round(last_weight, 2)

    def generate_warmup_sets(self, target_weight: float) -> list[dict[str, float | int]]:
        if target_weight <= 0:
            return []
        return [
            {"weight": round(target_weight * 0.2, 1), "reps": 10},
            {"weight": round(target_weight * 0.5, 1), "reps": 5},
            {"weight": round(target_weight * 0.67, 1), "reps": 3},
            {"weight": round(target_weight * 0.84, 1), "reps": 1},
        ]

    def realtime_companion_feedback(self, logged_set: SetEntry, target_reps: int) -> str:
        if logged_set.rpe >= 9.5:
            return "Fatigue detected. Reduce load by 2.5-5% next set."
        if logged_set.reps >= target_reps + 1 and logged_set.rpe <= 8:
            return "Strong set. Increase load by 2.5kg next set."
        return "Stay at current load and match target reps."

    def training_timeline(self, workouts: list[Workout]) -> list[str]:
        if not workouts:
            return []
        first = min(workouts, key=lambda w: w.started_at)
        latest = max(workouts, key=lambda w: w.started_at)
        return [
            f"{first.started_at.year} — training journey started",
            f"{latest.started_at.year} — latest logged phase",
        ]
