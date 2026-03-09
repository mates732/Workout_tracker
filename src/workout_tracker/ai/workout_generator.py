from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple

from workout_tracker.core.models import (
    ExerciseDefinition,
    ExperienceLevel,
    GeneratedWorkout,
    Goal,
    UserProfile,
    WorkoutPrescription,
)


@dataclass
class ExerciseStat:
    last_weight_kg: float
    last_reps: int


class AIWorkoutGenerator:
    """Rule-first workout generator implementing the requested 5-step algorithm."""

    WEEKLY_SETS = {
        ExperienceLevel.BEGINNER: (8, 12),
        ExperienceLevel.INTERMEDIATE: (12, 18),
        ExperienceLevel.ADVANCED: (16, 24),
    }

    def generate(
        self,
        profile: UserProfile,
        exercise_pool: List[ExerciseDefinition],
        recent_stats: Dict[str, ExerciseStat],
    ) -> GeneratedWorkout:
        split = self._determine_split(profile)
        per_session_sets = self._determine_volume(profile)
        rep_range, base_sets, rpe, rest_range = self._set_rep_scheme(profile.goal)

        ordered_exercises = self._select_exercises(exercise_pool, profile)
        prescriptions: List[WorkoutPrescription] = []

        for idx, exercise in enumerate(ordered_exercises[:6]):
            stat = recent_stats.get(exercise.name)
            suggested = round(stat.last_weight_kg + 2.5, 2) if stat else None
            rest_seconds = self._rest_for_exercise(exercise, rest_range)

            exercise_sets = base_sets
            if idx < 2:
                exercise_sets = max(base_sets, per_session_sets // 5)

            prescriptions.append(
                WorkoutPrescription(
                    exercise=exercise,
                    sets=exercise_sets,
                    rep_min=rep_range[0],
                    rep_max=rep_range[1],
                    target_rpe=rpe,
                    rest_seconds=rest_seconds,
                    suggested_weight_kg=suggested,
                )
            )

        warmup = [
            "5-8 minutes light cardio",
            "Dynamic mobility for target joints",
            "2 ramp-up sets for first compound lift",
        ]
        cooldown = [
            "3-5 minutes breathing down-regulation",
            "Light static stretching for trained muscles",
        ]

        return GeneratedWorkout(split=split, warmup=warmup, exercises=prescriptions, cooldown=cooldown)

    def _determine_split(self, profile: UserProfile) -> str:
        if profile.preferred_split and profile.preferred_split != "auto":
            return profile.preferred_split

        freq = profile.weekly_frequency
        if profile.experience == ExperienceLevel.BEGINNER or freq <= 3:
            return "full_body"
        if freq == 4:
            return "upper_lower"
        if profile.goal in (Goal.STRENGTH, Goal.HYPERTROPHY, Goal.MUSCLE_GAIN):
            return "push_pull_legs"
        return "body_part_split"

    def _determine_volume(self, profile: UserProfile) -> int:
        low, high = self.WEEKLY_SETS[profile.experience]
        midpoint = (low + high) // 2
        sessions = max(1, profile.weekly_frequency)
        return max(6, midpoint // sessions)

    def _set_rep_scheme(self, goal: Goal) -> Tuple[Tuple[int, int], int, float, Tuple[int, int]]:
        if goal == Goal.STRENGTH:
            return (3, 6), 5, 8.5, (120, 180)
        if goal in (Goal.HYPERTROPHY, Goal.MUSCLE_GAIN):
            return (6, 12), 4, 8.0, (60, 90)
        return (12, 20), 3, 7.0, (45, 60)

    def _select_exercises(self, exercise_pool: List[ExerciseDefinition], profile: UserProfile) -> List[ExerciseDefinition]:
        target = set(profile.target_muscles or [])
        allowed_equipment = set(e.lower() for e in profile.equipment) if profile.equipment else set()

        filtered = [
            exercise
            for exercise in exercise_pool
            if (not target or target.intersection(set(exercise.target_muscles)))
            and (
                not allowed_equipment
                or exercise.equipment.lower() in allowed_equipment
                or exercise.equipment.lower() == "bodyweight"
            )
        ]
        if not filtered:
            filtered = exercise_pool

        priority = {"compound": 0, "secondary_compound": 1, "hypertrophy": 2, "isolation": 3, "core": 4}
        return sorted(filtered, key=lambda e: priority.get(e.category, 5))

    def _rest_for_exercise(self, exercise: ExerciseDefinition, rest_range: Tuple[int, int]) -> int:
        if exercise.category == "isolation":
            return 60 if rest_range[0] >= 60 else rest_range[1]
        return rest_range[1]
