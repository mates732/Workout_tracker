from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional

from workout_tracker.core.models import (
    ExerciseDefinition,
    REST_SECONDS,
    SetLog,
    WorkoutHistoryEntry,
    WorkoutSession,
)


@dataclass
class PersonalRecords:
    highest_weight: float = 0
    most_reps: int = 0
    highest_volume: float = 0
    best_estimated_1rm: float = 0


class WorkoutSessionService:
    def __init__(self) -> None:
        self.history: List[WorkoutHistoryEntry] = []
        self.personal_records: Dict[str, PersonalRecords] = {}
        self.exercise_history: Dict[str, List[SetLog]] = {}
        self.offline_queue: List[WorkoutHistoryEntry] = []
        self.active_session: Optional[WorkoutSession] = None

    def start_workout(
        self,
        exercises: List[ExerciseDefinition],
        session_id: str = "local-session",
        user_id: str = "local-user",
    ) -> WorkoutSession:
        self.active_session = WorkoutSession(
            session_id=session_id,
            user_id=user_id,
            started_at=datetime.utcnow(),
            exercises=exercises,
        )
        return self.active_session

    def log_set(self, exercise_name: str, weight_kg: float, reps: int, rpe: float, completed: bool = True) -> SetLog:
        if not self.active_session:
            raise ValueError("No active workout session")
        exercise = next((e for e in self.active_session.exercises if e.name == exercise_name), None)
        if exercise is None:
            raise ValueError(f"Exercise {exercise_name} is not in active session")

        logs = self.active_session.set_logs.setdefault(exercise_name, [])
        entry = SetLog(
            set_number=len(logs) + 1,
            weight_kg=weight_kg,
            reps=reps,
            rpe=rpe,
            completed=completed,
            rest_seconds_started=REST_SECONDS[exercise.exercise_type] if completed else 0,
        )
        logs.append(entry)
        return entry

    def quick_log(self, exercise_name: str, base_weight_kg: float, base_reps: int, action: str) -> SetLog:
        if action == "+1 rep":
            return self.log_set(exercise_name, base_weight_kg, base_reps + 1, 8)
        if action == "+2.5kg":
            return self.log_set(exercise_name, base_weight_kg + 2.5, base_reps, 8)
        if action == "Complete set":
            return self.log_set(exercise_name, base_weight_kg, base_reps, 8)
        raise ValueError(f"Unsupported quick action: {action}")

    def finalize_workout(self, online: bool = True, duration_minutes: Optional[int] = None) -> WorkoutHistoryEntry:
        if not self.active_session:
            raise ValueError("No active workout session")
        ended_at = datetime.utcnow()
        elapsed = int((ended_at - self.active_session.started_at).total_seconds() // 60)
        workout = WorkoutHistoryEntry(
            date=ended_at,
            duration_minutes=duration_minutes or max(1, elapsed),
            exercises=self.active_session.set_logs,
        )
        if online:
            self._persist(workout)
        else:
            self.offline_queue.append(workout)
        self.active_session = None
        return workout

    def sync_offline(self) -> int:
        count = len(self.offline_queue)
        while self.offline_queue:
            self._persist(self.offline_queue.pop(0))
        return count

    def suggest_weight(self, exercise_name: str) -> Optional[float]:
        history = self.exercise_history.get(exercise_name, [])
        if not history:
            return None
        return round(history[-1].weight_kg + 2.5, 2)

    def get_exercise_performance(self, exercise_name: str) -> dict[str, list[float]]:
        history = self.exercise_history.get(exercise_name, [])
        return {
            "weight_progression": [item.weight_kg for item in history],
            "rep_progression": [item.reps for item in history],
            "volume_progression": [item.volume for item in history],
        }

    def summarize(self, workout: WorkoutHistoryEntry) -> dict:
        pr_messages: List[str] = []
        for exercise_name, logs in workout.exercises.items():
            pr_messages.extend(self._detect_prs(exercise_name, logs))

        return {
            "duration_minutes": workout.duration_minutes,
            "total_sets": workout.total_sets,
            "total_volume": workout.total_volume,
            "calories_burned_estimate": round(workout.duration_minutes * 6.5, 1),
            "new_prs": pr_messages,
        }


    # Backward-compatible aliases
    def sync_offline_queue(self) -> int:
        return self.sync_offline()

    def suggest_next_weight(self, exercise_name: str) -> Optional[float]:
        return self.suggest_weight(exercise_name)

    def workout_summary(self, workout: WorkoutHistoryEntry) -> dict:
        return self.summarize(workout)

    def _persist(self, workout: WorkoutHistoryEntry) -> None:
        self.history.append(workout)
        for ex, logs in workout.exercises.items():
            self.exercise_history.setdefault(ex, [])
            self.exercise_history[ex].extend(logs)

    def _detect_prs(self, exercise_name: str, logs: List[SetLog]) -> List[str]:
        prs = self.personal_records.setdefault(exercise_name, PersonalRecords())
        messages: List[str] = []

        highest_weight = max(log.weight_kg for log in logs)
        most_reps = max(log.reps for log in logs)
        highest_volume = sum(log.volume for log in logs)
        best_1rm = max(log.weight_kg * (1 + log.reps / 30) for log in logs)

        if highest_weight > prs.highest_weight:
            prs.highest_weight = highest_weight
            messages.append(f"New PR: {exercise_name} highest weight {highest_weight} kg")
        if most_reps > prs.most_reps:
            prs.most_reps = most_reps
            messages.append(f"New PR: {exercise_name} most reps {most_reps}")
        if highest_volume > prs.highest_volume:
            prs.highest_volume = highest_volume
            messages.append(f"New PR: {exercise_name} highest volume {highest_volume:.1f}")
        if best_1rm > prs.best_estimated_1rm:
            prs.best_estimated_1rm = best_1rm
            messages.append(f"New PR: {exercise_name} estimated 1RM {best_1rm:.1f}")
        return messages
