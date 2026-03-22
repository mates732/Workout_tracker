from __future__ import annotations

from datetime import date, timedelta

from workout_tracker.core.models import DietPhase, Goal, TransformationForecast, UserProfile


class DietPhasePlanner:
    def current_phase(self, profile: UserProfile, current_weight_kg: float) -> DietPhase:
        if profile.goal == Goal.FAT_LOSS:
            calories = int(current_weight_kg * 28)
            protein = int(current_weight_kg * 2.2)
            phase = "cut"
        elif profile.goal == Goal.MUSCLE_GAIN:
            calories = int(current_weight_kg * 36)
            protein = int(current_weight_kg * 2.0)
            phase = "bulk"
        elif profile.goal in (Goal.STRENGTH, Goal.HYPERTROPHY):
            calories = int(current_weight_kg * 34)
            protein = int(current_weight_kg * 2.1)
            phase = "performance"
        else:
            calories = int(current_weight_kg * 31)
            protein = int(current_weight_kg * 1.8)
            phase = "maintenance"

        start = date.today()
        return DietPhase(
            phase=phase,
            calorie_target=calories,
            protein_target_g=protein,
            start_date=start,
            end_date=start + timedelta(days=27),
        )


class TransformationPredictionEngine:
    def forecast(self, profile: UserProfile, current_weight_kg: float, adherence_score: float) -> TransformationForecast:
        adherence = max(0.1, min(1.0, adherence_score))

        if profile.goal == Goal.FAT_LOSS:
            delta = -0.4 * adherence
            bf_delta = -0.25 * adherence
        elif profile.goal == Goal.MUSCLE_GAIN:
            delta = 0.25 * adherence
            bf_delta = 0.05 * adherence
        elif profile.goal in (Goal.MUSCLE_GAIN, Goal.HYPERTROPHY, Goal.STRENGTH):
            delta = 0.2 * adherence
            bf_delta = 0.03 * adherence
        else:
            delta = -0.1 * adherence
            bf_delta = -0.08 * adherence

        return TransformationForecast(
            expected_weight_kg=round(current_weight_kg + delta, 2),
            expected_body_fat_pct=round(18 + bf_delta, 2),
            confidence=round(0.6 + adherence * 0.35, 2),
        )
