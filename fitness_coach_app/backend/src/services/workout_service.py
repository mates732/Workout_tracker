from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.orm import Session, sessionmaker

from models.exercise_db import ExerciseDB
from models.tracker_db import SetLogDB, WorkoutExerciseDB, WorkoutSessionDB
from repositories.workout_repository import WorkoutRepository


@dataclass
class WorkoutService:
    """Business logic for a fast, deterministic workout tracker backend."""

    session_factory: sessionmaker[Session]
    repository: WorkoutRepository

    @staticmethod
    def _serialize_session(workout: WorkoutSessionDB) -> dict:
        return {
            "id": workout.id,
            "user_id": workout.user_id,
            "status": workout.status,
            "start_time": workout.start_time.isoformat(),
            "end_time": workout.end_time.isoformat() if workout.end_time else None,
        }

    @staticmethod
    def _serialize_set(logged_set: SetLogDB) -> dict:
        return {
            "id": logged_set.id,
            "workout_id": logged_set.workout_id,
            "workout_exercise_id": logged_set.workout_exercise_id,
            "exercise_id": logged_set.exercise_id,
            "weight": float(logged_set.weight),
            "reps": logged_set.reps,
            "rpe": float(logged_set.rpe),
            "duration": logged_set.duration,
            "completed": logged_set.completed,
            "volume": round(float(logged_set.weight) * logged_set.reps, 4),
            "created_at": logged_set.created_at.isoformat(),
            "updated_at": logged_set.updated_at.isoformat(),
        }

    def _serialize_workout_exercise(self, workout_exercise: WorkoutExerciseDB, exercise: ExerciseDB, sets: list[SetLogDB]) -> dict:
        return {
            "id": workout_exercise.id,
            "workout_id": workout_exercise.workout_id,
            "exercise_id": exercise.id,
            "name": exercise.name,
            "muscle_group": exercise.muscle_group,
            "equipment": exercise.equipment,
            "ordering": workout_exercise.ordering,
            "sets": [self._serialize_set(item) for item in sets],
        }

    @staticmethod
    def _is_success(previous: SetLogDB | None, current: SetLogDB) -> bool:
        if previous is None:
            return True
        return float(current.weight) > float(previous.weight) or (
            float(current.weight) == float(previous.weight) and current.reps >= previous.reps
        )

    @staticmethod
    def _consistency_band(score: float) -> str:
        if score >= 0.75:
            return "high"
        if score >= 0.4:
            return "medium"
        return "low"

    @staticmethod
    def _trend_from_points(points: list[dict]) -> str:
        if len(points) < 2:
            return "flat"
        previous = points[-2]
        latest = points[-1]
        if latest["volume"] > previous["volume"]:
            return "up"
        if latest["volume"] < previous["volume"]:
            return "down"
        if latest["max_weight"] > previous["max_weight"]:
            return "up"
        if latest["max_weight"] < previous["max_weight"]:
            return "down"
        return "flat"

    def _resolve_exercise(self, session: Session, exercise_id: int | None, exercise_name: str | None) -> ExerciseDB:
        exercise: ExerciseDB | None = None
        if exercise_id is not None:
            exercise = self.repository.get_exercise_by_id(session, exercise_id)
        elif exercise_name and exercise_name.strip():
            exercise = self.repository.get_exercise_by_name(session, exercise_name)

        if exercise is None:
            raise KeyError("Exercise not found")
        return exercise

    def _resolve_workout_exercise(
        self,
        session: Session,
        workout: WorkoutSessionDB,
        *,
        workout_exercise_id: str | None,
        exercise_id: int | None,
        exercise_name: str | None,
        auto_create: bool,
    ) -> tuple[WorkoutExerciseDB, ExerciseDB]:
        if workout_exercise_id:
            workout_exercise = self.repository.get_workout_exercise_by_id(session, workout_exercise_id.strip())
            if workout_exercise is None or workout_exercise.workout_id != workout.id:
                raise KeyError("Workout exercise not found")
            exercise = self.repository.get_exercise_by_id(session, workout_exercise.exercise_id)
            if exercise is None:
                raise KeyError("Exercise not found")
            return workout_exercise, exercise

        exercise = self._resolve_exercise(session, exercise_id=exercise_id, exercise_name=exercise_name)
        workout_exercise = self.repository.get_workout_exercise(session, workout.id, exercise.id)
        if workout_exercise is None and auto_create:
            workout_exercise = self.repository.add_exercise_to_workout(session, workout.id, exercise.id)
        if workout_exercise is None:
            raise KeyError("Exercise is not part of workout")
        return workout_exercise, exercise

    def _consistency_score(self, session: Session, user_id: str, exercise_id: int, current_workout_id: str) -> float:
        recent_workout_ids = self.repository.list_recent_workout_ids(
            session,
            user_id,
            limit=5,
            exclude_workout_id=current_workout_id,
        )
        if not recent_workout_ids:
            return 1.0
        with_exercise = self.repository.count_workouts_with_exercise(session, user_id, exercise_id, recent_workout_ids)
        return round(with_exercise / len(recent_workout_ids), 4)

    def _build_feedback(
        self,
        current: SetLogDB,
        previous: SetLogDB | None,
        best_previous: SetLogDB | None,
    ) -> dict:
        return {
            "difference_weight": round(float(current.weight) - float(previous.weight), 4) if previous else None,
            "difference_reps": current.reps - previous.reps if previous else None,
            "pr": best_previous is None
            or float(current.weight) > float(best_previous.weight)
            or (float(current.weight) == float(best_previous.weight) and current.reps > best_previous.reps),
        }

    def _build_recommendation(
        self,
        session: Session,
        workout: WorkoutSessionDB,
        exercise: ExerciseDB,
        current: SetLogDB,
        previous: SetLogDB | None,
    ) -> dict:
        progress_points = [
            item
            for item in self.repository.get_progress_points(session, workout.user_id, exercise.id)
            if item["workout_id"] != workout.id
        ]
        trend = self._trend_from_points(progress_points)
        success = self._is_success(previous, current)

        current_exercise_sets = self.repository.list_sets_for_workout_and_exercise(session, workout.id, exercise.id)
        fatigue_failed_sets = 0
        if previous is not None:
            fatigue_failed_sets = sum(1 for item in current_exercise_sets if not self._is_success(previous, item))

        all_workout_sets = self.repository.list_sets_for_workout(session, workout.id)
        workout_state = {
            "workout_id": workout.id,
            "total_sets": len(all_workout_sets),
            "exercise_sets": len(current_exercise_sets),
        }
        consistency_score = self._consistency_score(session, workout.user_id, exercise.id, workout.id)
        consistency = self._consistency_band(consistency_score)
        adjustments: list[str] = []

        if success:
            next_weight_kg = round(float(current.weight) + 2.5, 4)
            next_reps = current.reps
            action = "increase"
            if fatigue_failed_sets >= 2:
                next_reps = max(1, next_reps - 1)
                adjustments.append("fatigue_reps_down")
            if workout_state["total_sets"] >= 12:
                next_reps = max(1, next_reps - 1)
                adjustments.append("late_workout_reps_down")
            if consistency == "low":
                next_reps = max(1, next_reps - 1)
                adjustments.append("low_consistency_reps_down")
        else:
            action = "reduce" if trend == "down" else "hold"
            next_weight_kg = (
                round(max(0.0, float(current.weight) - 2.5), 4)
                if action == "reduce"
                else round(float(current.weight), 4)
            )
            next_reps = previous.reps if previous else current.reps
            if fatigue_failed_sets >= 2 and action != "reduce":
                action = "reduce"
                next_weight_kg = round(max(0.0, float(current.weight) - 2.5), 4)
                adjustments.append("fatigue_forced_reduce")
            if consistency == "low":
                next_reps = max(1, next_reps - 1)
                adjustments.append("low_consistency_reps_down")

        return {
            "next_weight_kg": next_weight_kg,
            "next_reps": next_reps,
            "result": "success" if success else "fail",
            "trend": trend,
            "action": action,
            "context": {
                "workout_state": workout_state,
                "fatigue_failed_sets": fatigue_failed_sets,
                "consistency_score": consistency_score,
                "consistency": consistency,
            },
            "adjustments": adjustments,
        }

    def start_session(self, user_id: str) -> dict:
        resolved_user_id = user_id.strip()
        if not resolved_user_id:
            raise ValueError("user_id is required")

        with self.session_factory.begin() as session:
            active = self.repository.get_active_session(session, resolved_user_id)
            if active is not None:
                return {"resumed": True, "workout": self._serialize_session(active)}

            created = self.repository.create_session(session, resolved_user_id)
            return {"resumed": False, "workout": self._serialize_session(created)}

    def finish_session(self, workout_id: str) -> dict:
        resolved_workout_id = workout_id.strip()
        if not resolved_workout_id:
            raise ValueError("workout id is required")

        with self.session_factory.begin() as session:
            workout = self.repository.get_session(session, resolved_workout_id)
            if workout is None:
                raise KeyError("Workout session not found")
            if workout.status != "finished":
                self.repository.finish_session(session, workout)
            return {"workout": self._serialize_session(workout)}

    def get_active_session(self, user_id: str) -> dict:
        resolved_user_id = user_id.strip()
        if not resolved_user_id:
            raise ValueError("user_id is required")

        with self.session_factory() as session:
            active = self.repository.get_active_session(session, resolved_user_id)
            return {"workout": self._serialize_session(active)} if active else {"workout": None}

    def add_exercise_to_workout(self, workout_id: str, exercise_id: int | None = None, exercise_name: str | None = None) -> dict:
        resolved_workout_id = workout_id.strip()
        if not resolved_workout_id:
            raise ValueError("workout id is required")

        with self.session_factory.begin() as session:
            workout = self.repository.get_session(session, resolved_workout_id)
            if workout is None:
                raise KeyError("Workout session not found")
            exercise = self._resolve_exercise(session, exercise_id=exercise_id, exercise_name=exercise_name)
            workout_exercise = self.repository.get_workout_exercise(session, workout.id, exercise.id)
            if workout_exercise is None:
                workout_exercise = self.repository.add_exercise_to_workout(session, workout.id, exercise.id)

            sets = self.repository.list_sets_by_workout_exercise(session, workout_exercise.id)
            return {
                "exercise": self._serialize_workout_exercise(workout_exercise, exercise, sets),
                "workout": self._serialize_session(workout),
            }

    def get_workout_state(self, workout_id: str) -> dict:
        resolved_workout_id = workout_id.strip()
        if not resolved_workout_id:
            raise ValueError("workout id is required")

        with self.session_factory() as session:
            workout = self.repository.get_session(session, resolved_workout_id)
            if workout is None:
                raise KeyError("Workout session not found")

            exercises_payload: list[dict] = []
            for workout_exercise, exercise in self.repository.list_workout_exercises(session, workout.id):
                sets = self.repository.list_sets_by_workout_exercise(session, workout_exercise.id)
                exercises_payload.append(self._serialize_workout_exercise(workout_exercise, exercise, sets))
            return {"workout": {**self._serialize_session(workout), "exercises": exercises_payload}}

    def search_exercises(self, query: str | None = None, muscle_group: str | None = None, limit: int = 30) -> dict:
        if limit <= 0:
            raise ValueError("limit must be positive")

        with self.session_factory() as session:
            exercises = self.repository.search_exercises(session, query=query, muscle_group=muscle_group, limit=limit)
            return {
                "count": len(exercises),
                "exercises": [
                    {
                        "id": item.id,
                        "name": item.name,
                        "muscle_group": item.muscle_group,
                        "equipment": item.equipment,
                        "instructions": item.instructions,
                    }
                    for item in exercises
                ],
            }

    def log_set(
        self,
        workout_id: str,
        weight: float,
        reps: int,
        rpe: float,
        *,
        duration: int = 90,
        completed: bool = True,
        workout_exercise_id: str | None = None,
        exercise_id: int | None = None,
        exercise_name: str | None = None,
    ) -> dict:
        if weight <= 0 or reps <= 0:
            raise ValueError("weight and reps must be positive")
        if not 1 <= rpe <= 10:
            raise ValueError("rpe must be in range 1..10")
        if duration < 0:
            raise ValueError("duration must be >= 0")

        resolved_workout_id = workout_id.strip()
        if not resolved_workout_id:
            raise ValueError("workout id is required")

        with self.session_factory.begin() as session:
            workout = self.repository.get_session(session, resolved_workout_id)
            if workout is None:
                raise KeyError("Workout session not found")
            if workout.status != "active":
                raise ValueError("workout session is not active")

            workout_exercise, exercise = self._resolve_workout_exercise(
                session,
                workout,
                workout_exercise_id=workout_exercise_id,
                exercise_id=exercise_id,
                exercise_name=exercise_name,
                auto_create=True,
            )
            previous = self.repository.get_last_set_from_previous_workouts(session, workout.user_id, exercise.id, workout.id)
            best_previous = self.repository.get_best_set_from_previous_workouts(session, workout.user_id, exercise.id, workout.id)

            logged_set = self.repository.create_set_log(
                session,
                workout_id=workout.id,
                workout_exercise_id=workout_exercise.id,
                user_id=workout.user_id,
                exercise_id=exercise.id,
                weight=weight,
                reps=reps,
                rpe=rpe,
                duration=duration,
                completed=completed,
            )
            feedback = self._build_feedback(logged_set, previous, best_previous)
            suggestion = self._build_recommendation(session, workout, exercise, logged_set, previous)
            return {
                "set": self._serialize_set(logged_set),
                "feedback": feedback,
                "suggestion": suggestion,
                "exercise": {
                    "id": workout_exercise.id,
                    "exercise_id": exercise.id,
                    "name": exercise.name,
                },
                "workout": self._serialize_session(workout),
            }

    def update_set(
        self,
        set_id: str,
        *,
        weight: float | None = None,
        reps: int | None = None,
        rpe: float | None = None,
        duration: int | None = None,
        completed: bool | None = None,
    ) -> dict:
        resolved_set_id = set_id.strip()
        if not resolved_set_id:
            raise ValueError("set id is required")
        if weight is not None and weight <= 0:
            raise ValueError("weight must be positive")
        if reps is not None and reps <= 0:
            raise ValueError("reps must be positive")
        if rpe is not None and not 1 <= rpe <= 10:
            raise ValueError("rpe must be in range 1..10")
        if duration is not None and duration < 0:
            raise ValueError("duration must be >= 0")

        with self.session_factory.begin() as session:
            logged_set = self.repository.get_set_log(session, resolved_set_id)
            if logged_set is None:
                raise KeyError("Set not found")
            self.repository.update_set_log(
                session,
                logged_set,
                weight=weight,
                reps=reps,
                rpe=rpe,
                duration=duration,
                completed=completed,
            )
            workout = self.repository.get_session(session, logged_set.workout_id)
            if workout is None:
                raise KeyError("Workout session not found")
            previous = self.repository.get_last_set_from_previous_workouts(
                session,
                workout.user_id,
                logged_set.exercise_id,
                workout.id,
            )
            best_previous = self.repository.get_best_set_from_previous_workouts(
                session,
                workout.user_id,
                logged_set.exercise_id,
                workout.id,
            )
            exercise = self.repository.get_exercise_by_id(session, logged_set.exercise_id)
            if exercise is None:
                raise KeyError("Exercise not found")
            feedback = self._build_feedback(logged_set, previous, best_previous)
            suggestion = self._build_recommendation(session, workout, exercise, logged_set, previous)
            return {
                "set": self._serialize_set(logged_set),
                "feedback": feedback,
                "suggestion": suggestion,
            }

    def get_progress(self, exercise_id: int, user_id: str | None = None) -> dict:
        if exercise_id <= 0:
            raise ValueError("exercise_id must be positive")

        with self.session_factory() as session:
            exercise = self.repository.get_exercise_by_id(session, exercise_id)
            if exercise is None:
                raise KeyError("Exercise not found")

            resolved_user_id = (user_id or "").strip()
            if not resolved_user_id:
                latest = self.repository.get_latest_set_for_exercise(session, exercise_id)
                if latest is None:
                    raise KeyError("No progress data for exercise")
                resolved_user_id = latest.user_id

            points = self.repository.get_progress_points(session, resolved_user_id, exercise_id)
            return {
                "exercise_id": exercise.id,
                "exercise_name": exercise.name,
                "user_id": resolved_user_id,
                "weight_over_time": [
                    {"timestamp": item["timestamp"].isoformat(), "weight": item["max_weight"]} for item in points
                ],
                "volume_trend": [
                    {"timestamp": item["timestamp"].isoformat(), "volume": item["volume"]} for item in points
                ],
            }
