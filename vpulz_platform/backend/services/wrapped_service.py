from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta

from vpulz_platform.backend.models.entities import Workout


_PERIOD_DAYS = {
    "weekly": 7,
    "bi-weekly": 14,
    "monthly": 30,
}


@dataclass
class WrappedService:
    def generate_wrapped(self, workouts: list[Workout], period: str) -> dict:
        days = _PERIOD_DAYS.get(period, 30)
        now = datetime.utcnow()
        start = now - timedelta(days=days)
        scoped = [w for w in workouts if w.started_at >= start]

        metrics = self._calculate_metrics(scoped)
        ai_commentary = self._generate_ai_commentary(metrics)
        slides = self._build_slides(period, metrics)

        return {
            "period": period,
            "metrics": metrics,
            "ai_commentary": ai_commentary,
            "slides": slides,
        }

    def _calculate_metrics(self, workouts: list[Workout]) -> dict:
        if not workouts:
            return {
                "sessions": 0,
                "total_volume": 0.0,
                "dominant_exercise": "n/a",
                "biggest_lift": "n/a",
                "pr_count": 0,
                "consistency_score": 0.0,
                "longest_streak_days": 0,
                "most_productive_day": "n/a",
                "strength_growth_pct": 0.0,
                "fatigue_peak_week": "n/a",
                "training_personality": "The Explorer",
                "comeback_moment": "n/a",
            }

        exercise_counter: dict[str, int] = {}
        day_volume: dict[str, float] = {d: 0.0 for d in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
        biggest = (0.0, "")
        total_volume = 0.0
        high_effort_sets = 0

        by_date = sorted({w.started_at.date() for w in workouts})
        streak = self._longest_streak(by_date)

        for w in workouts:
            for ex in w.exercises:
                exercise_counter[ex.exercise_name] = exercise_counter.get(ex.exercise_name, 0) + len(ex.sets)
                for s in ex.sets:
                    total_volume += s.volume
                    day_volume[w.started_at.strftime("%a")] += s.volume
                    if s.weight > biggest[0]:
                        biggest = (s.weight, ex.exercise_name)
                    if s.rpe >= 9:
                        high_effort_sets += 1

        dominant_exercise = max(exercise_counter, key=exercise_counter.get)
        biggest_lift = f"{biggest[0]:.1f} kg {biggest[1]}"
        sessions = len(workouts)
        consistency_score = round(min(100.0, sessions * 5.5), 2)

        dates_sorted = sorted(workouts, key=lambda w: w.started_at)
        baseline = self._estimated_1rm(dates_sorted[0])
        latest = self._estimated_1rm(dates_sorted[-1])
        strength_growth = round(((latest - baseline) / baseline) * 100, 2) if baseline > 0 else 0.0

        pr_count = sum(1 for w in workouts for ex in w.exercises if ex.sets and max(s.weight for s in ex.sets) >= 0.98 * biggest[0])
        most_productive_day = max(day_volume, key=day_volume.get)
        fatigue_peak_week = "week 2" if high_effort_sets >= 6 else "week 1"

        personality = "The Grinder" if consistency_score >= 70 and total_volume >= 10000 else "The Power Builder"
        comeback_moment = self._comeback_workout(workouts, biggest_lift)

        return {
            "sessions": sessions,
            "total_volume": round(total_volume, 2),
            "dominant_exercise": dominant_exercise,
            "biggest_lift": biggest_lift,
            "pr_count": pr_count,
            "consistency_score": consistency_score,
            "longest_streak_days": streak,
            "most_productive_day": most_productive_day,
            "strength_growth_pct": strength_growth,
            "fatigue_peak_week": fatigue_peak_week,
            "training_personality": personality,
            "comeback_moment": comeback_moment,
        }

    def _generate_ai_commentary(self, metrics: dict) -> list[str]:
        if metrics["sessions"] == 0:
            return ["Start logging workouts to unlock your first VPULZ Wrapped story."]

        commentary = [
            f"You trained {metrics['sessions']} times with a consistency score of {metrics['consistency_score']}.",
            f"Your strongest pattern is {metrics['dominant_exercise']} and your top lift was {metrics['biggest_lift']}.",
        ]
        if metrics["strength_growth_pct"] > 0:
            commentary.append(f"Strength momentum is positive: +{metrics['strength_growth_pct']}% estimated improvement.")
        commentary.append(f"You profile as {metrics['training_personality']}. Keep this identity strong next cycle.")
        return commentary

    def _build_slides(self, period: str, metrics: dict) -> list[dict]:
        return [
            {
                "order": 1,
                "title": "Consistency Unlocked",
                "body": f"You trained {metrics['sessions']} times this {period}.",
                "metric_key": "sessions",
                "metric_value": str(metrics["sessions"]),
                "share_caption": f"{metrics['sessions']} sessions in my VPULZ {period} 💥",
            },
            {
                "order": 2,
                "title": "Total Iron Moved",
                "body": f"You lifted {metrics['total_volume']:.0f} kg total.",
                "metric_key": "total_volume",
                "metric_value": f"{metrics['total_volume']:.0f} kg",
                "share_caption": f"{metrics['total_volume']:.0f} kg lifted this {period} with VPULZ",
            },
            {
                "order": 3,
                "title": "Signature Exercise",
                "body": f"{metrics['dominant_exercise']} was your most trained movement.",
                "metric_key": "dominant_exercise",
                "metric_value": metrics["dominant_exercise"],
                "share_caption": f"My VPULZ signature move: {metrics['dominant_exercise']}",
            },
            {
                "order": 4,
                "title": "Strongest Moment",
                "body": f"Your biggest lift was {metrics['biggest_lift']}.",
                "metric_key": "biggest_lift",
                "metric_value": metrics["biggest_lift"],
                "share_caption": f"Strongest VPULZ moment: {metrics['biggest_lift']}",
            },
            {
                "order": 5,
                "title": "Progress Story",
                "body": f"Your estimated strength changed by {metrics['strength_growth_pct']}%.",
                "metric_key": "strength_growth_pct",
                "metric_value": f"{metrics['strength_growth_pct']}%",
                "share_caption": f"{metrics['strength_growth_pct']}% strength change this {period} 📈",
            },
            {
                "order": 6,
                "title": "Next Chapter",
                "body": "Ready to beat this next cycle?",
                "metric_key": "training_personality",
                "metric_value": metrics["training_personality"],
                "share_caption": "VPULZ Wrapped complete. Next cycle starts now.",
            },
        ]

    def _estimated_1rm(self, workout: Workout) -> float:
        values = [s.weight * (1 + s.reps / 30) for ex in workout.exercises for s in ex.sets]
        return max(values, default=0.0)

    def _longest_streak(self, dates: list) -> int:
        if not dates:
            return 0
        best = 1
        current = 1
        for i in range(1, len(dates)):
            if dates[i] == dates[i - 1] + timedelta(days=1):
                current += 1
                best = max(best, current)
            else:
                current = 1
        return best

    def _comeback_workout(self, workouts: list[Workout], biggest_lift: str) -> str:
        ordered = sorted(workouts, key=lambda w: w.started_at)
        for i in range(1, len(ordered)):
            gap = (ordered[i].started_at.date() - ordered[i - 1].started_at.date()).days
            if gap >= 5:
                return f"After {gap} days off, you returned and built momentum."
        return f"Your standout lift was {biggest_lift}."
