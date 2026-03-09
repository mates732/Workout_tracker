from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List

from workout_tracker.core.models import ExerciseDefinition, SetLog, WorkoutPrescription


FATIGUE_POINTS = {
    "compound": 3,
    "secondary_compound": 2,
    "isolation": 1,
    "core": 1,
}

RECOVERY_HOURS = {
    "chest": 48,
    "back": 48,
    "legs": 72,
    "shoulders": 48,
    "arms": 30,
    "core": 24,
}


@dataclass
class ReadinessSignals:
    completed_reps_ratio: float
    avg_rpe: float
    training_consistency: float
    sleep_hours: float
    fatigue_score: float


class MuscleFatigueModel:
    def __init__(self) -> None:
        self.state: Dict[str, Dict[str, float | datetime]] = {}

    def score_workout_fatigue(self, exercises: List[ExerciseDefinition], set_logs: Dict[str, List[SetLog]]) -> Dict[str, float]:
        scored: Dict[str, float] = {}
        for exercise in exercises:
            logs = set_logs.get(exercise.name, [])
            if not logs:
                continue
            points = FATIGUE_POINTS.get(exercise.category, 1) * len(logs)
            for muscle in exercise.target_muscles:
                scored[muscle] = scored.get(muscle, 0) + points
                self.state[muscle] = {"fatigue": scored[muscle], "updated_at": datetime.utcnow()}
        return scored

    def decay(self, muscle: str, elapsed_hours: float, current_score: float) -> float:
        recovery = RECOVERY_HOURS.get(muscle, 48)
        decay_fraction = min(1.0, elapsed_hours / recovery)
        return round(current_score * (1 - decay_fraction), 2)


class AutoregulationService:
    def adjust_next_workout(self, prescriptions: List[WorkoutPrescription], signals: ReadinessSignals) -> List[WorkoutPrescription]:
        adjusted: List[WorkoutPrescription] = []

        for item in prescriptions:
            next_item = WorkoutPrescription(
                exercise=item.exercise,
                sets=item.sets,
                rep_min=item.rep_min,
                rep_max=item.rep_max,
                target_rpe=item.target_rpe,
                rest_seconds=item.rest_seconds,
                suggested_weight_kg=item.suggested_weight_kg,
            )

            if signals.completed_reps_ratio >= 0.98 and signals.avg_rpe <= 7.5 and next_item.suggested_weight_kg:
                next_item.suggested_weight_kg = round(next_item.suggested_weight_kg * 1.035, 2)

            if signals.completed_reps_ratio <= 0.75 and signals.avg_rpe >= 9 and next_item.suggested_weight_kg:
                next_item.suggested_weight_kg = round(next_item.suggested_weight_kg * 0.95, 2)

            if signals.fatigue_score >= 7:
                next_item.sets = max(1, int(round(next_item.sets * 0.8)))

            if signals.sleep_hours < 6:
                next_item.target_rpe = round(max(6.5, next_item.target_rpe - 0.5), 1)

            if signals.training_consistency < 0.6:
                next_item.target_rpe = round(max(6.5, next_item.target_rpe - 0.3), 1)

            adjusted.append(next_item)

        return adjusted
