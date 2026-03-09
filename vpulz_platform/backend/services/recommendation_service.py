from __future__ import annotations

from vpulz_platform.backend.models.entities import UserProfile, Workout


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

    def adjust_workout_based_on_progress(self, progression_trend: str, planned_sets: int) -> int:
        if progression_trend == "increasing":
            return planned_sets + 1
        if progression_trend == "decreasing":
            return max(1, planned_sets - 1)
        return planned_sets

    def recommend_next_weight(self, last_weight: float, reps_achieved: int, target_reps: int) -> float:
        if reps_achieved >= target_reps:
            return round(last_weight + 2.5, 2)
        if reps_achieved <= target_reps - 2:
            return round(max(0.0, last_weight * 0.95), 2)
        return round(last_weight, 2)
