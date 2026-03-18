from __future__ import annotations

from datetime import datetime
from typing import Iterable
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from models.exercise_db import ExerciseDB
from models.tracker_db import SetLogDB, WorkoutExerciseDB, WorkoutSessionDB


class WorkoutRepository:
    """Database access layer for workout tracking primitives."""

    @staticmethod
    def get_session(session: Session, workout_id: str) -> WorkoutSessionDB | None:
        return session.get(WorkoutSessionDB, workout_id)

    @staticmethod
    def get_active_session(session: Session, user_id: str) -> WorkoutSessionDB | None:
        stmt = (
            select(WorkoutSessionDB)
            .where(WorkoutSessionDB.user_id == user_id, WorkoutSessionDB.status == "active")
            .order_by(WorkoutSessionDB.start_time.desc())
            .limit(1)
        )
        return session.execute(stmt).scalar_one_or_none()

    @staticmethod
    def create_session(session: Session, user_id: str) -> WorkoutSessionDB:
        workout = WorkoutSessionDB(id=str(uuid4()), user_id=user_id, status="active")
        session.add(workout)
        session.flush()
        return workout

    @staticmethod
    def finish_session(session: Session, workout: WorkoutSessionDB) -> WorkoutSessionDB:
        workout.status = "finished"
        workout.end_time = datetime.utcnow()
        session.flush()
        return workout

    @staticmethod
    def get_exercise_by_id(session: Session, exercise_id: int) -> ExerciseDB | None:
        return session.get(ExerciseDB, exercise_id)

    @staticmethod
    def get_exercise_by_name(session: Session, name: str) -> ExerciseDB | None:
        normalized = name.strip().lower()
        if not normalized:
            return None
        stmt = select(ExerciseDB).where(func.lower(ExerciseDB.name) == normalized).limit(1)
        return session.execute(stmt).scalar_one_or_none()

    @staticmethod
    def search_exercises(
        session: Session,
        query: str | None = None,
        muscle_group: str | None = None,
        limit: int = 30,
    ) -> list[ExerciseDB]:
        stmt = select(ExerciseDB)
        if query and query.strip():
            term = f"%{query.strip().lower()}%"
            stmt = stmt.where(func.lower(ExerciseDB.name).like(term))
        if muscle_group and muscle_group.strip():
            stmt = stmt.where(func.lower(ExerciseDB.muscle_group) == muscle_group.strip().lower())
        stmt = stmt.order_by(ExerciseDB.name.asc()).limit(limit)
        return list(session.execute(stmt).scalars().all())

    @staticmethod
    def list_workout_exercises(session: Session, workout_id: str) -> list[tuple[WorkoutExerciseDB, ExerciseDB]]:
        stmt = (
            select(WorkoutExerciseDB, ExerciseDB)
            .join(ExerciseDB, ExerciseDB.id == WorkoutExerciseDB.exercise_id)
            .where(WorkoutExerciseDB.workout_id == workout_id)
            .order_by(WorkoutExerciseDB.ordering.asc(), WorkoutExerciseDB.created_at.asc())
        )
        return list(session.execute(stmt).all())

    @staticmethod
    def get_workout_exercise(session: Session, workout_id: str, exercise_id: int) -> WorkoutExerciseDB | None:
        stmt = (
            select(WorkoutExerciseDB)
            .where(
                WorkoutExerciseDB.workout_id == workout_id,
                WorkoutExerciseDB.exercise_id == exercise_id,
            )
            .limit(1)
        )
        return session.execute(stmt).scalar_one_or_none()

    @staticmethod
    def get_workout_exercise_by_id(session: Session, workout_exercise_id: str) -> WorkoutExerciseDB | None:
        return session.get(WorkoutExerciseDB, workout_exercise_id)

    @staticmethod
    def add_exercise_to_workout(session: Session, workout_id: str, exercise_id: int) -> WorkoutExerciseDB:
        current_max = session.execute(
            select(func.max(WorkoutExerciseDB.ordering)).where(WorkoutExerciseDB.workout_id == workout_id)
        ).scalar_one_or_none()
        next_ordering = 0 if current_max is None else int(current_max) + 1
        workout_exercise = WorkoutExerciseDB(
            id=str(uuid4()),
            workout_id=workout_id,
            exercise_id=exercise_id,
            ordering=next_ordering,
        )
        session.add(workout_exercise)
        session.flush()
        return workout_exercise

    @staticmethod
    def create_set_log(
        session: Session,
        workout_id: str,
        workout_exercise_id: str,
        user_id: str,
        exercise_id: int,
        weight: float,
        reps: int,
        rpe: float,
        duration: int,
        completed: bool,
    ) -> SetLogDB:
        logged_set = SetLogDB(
            id=str(uuid4()),
            workout_id=workout_id,
            workout_exercise_id=workout_exercise_id,
            user_id=user_id,
            exercise_id=exercise_id,
            weight=weight,
            reps=reps,
            rpe=rpe,
            duration=duration,
            completed=completed,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        session.add(logged_set)
        session.flush()
        return logged_set

    @staticmethod
    def get_set_log(session: Session, set_id: str) -> SetLogDB | None:
        return session.get(SetLogDB, set_id)

    @staticmethod
    def update_set_log(
        session: Session,
        logged_set: SetLogDB,
        *,
        weight: float | None = None,
        reps: int | None = None,
        rpe: float | None = None,
        duration: int | None = None,
        completed: bool | None = None,
    ) -> SetLogDB:
        if weight is not None:
            logged_set.weight = weight
        if reps is not None:
            logged_set.reps = reps
        if rpe is not None:
            logged_set.rpe = rpe
        if duration is not None:
            logged_set.duration = duration
        if completed is not None:
            logged_set.completed = completed
        logged_set.updated_at = datetime.utcnow()
        session.flush()
        return logged_set

    @staticmethod
    def list_sets_by_workout_exercise(session: Session, workout_exercise_id: str) -> list[SetLogDB]:
        stmt = (
            select(SetLogDB)
            .where(SetLogDB.workout_exercise_id == workout_exercise_id)
            .order_by(SetLogDB.created_at.asc())
        )
        return list(session.execute(stmt).scalars().all())

    @staticmethod
    def list_sets_for_workout(session: Session, workout_id: str) -> list[SetLogDB]:
        stmt = select(SetLogDB).where(SetLogDB.workout_id == workout_id).order_by(SetLogDB.created_at.asc())
        return list(session.execute(stmt).scalars().all())

    @staticmethod
    def list_sets_for_workout_and_exercise(session: Session, workout_id: str, exercise_id: int) -> list[SetLogDB]:
        stmt = (
            select(SetLogDB)
            .where(SetLogDB.workout_id == workout_id, SetLogDB.exercise_id == exercise_id)
            .order_by(SetLogDB.created_at.asc())
        )
        return list(session.execute(stmt).scalars().all())

    @staticmethod
    def get_last_set_from_previous_workouts(
        session: Session,
        user_id: str,
        exercise_id: int,
        current_workout_id: str,
    ) -> SetLogDB | None:
        stmt = (
            select(SetLogDB)
            .where(
                SetLogDB.user_id == user_id,
                SetLogDB.exercise_id == exercise_id,
                SetLogDB.workout_id != current_workout_id,
            )
            .order_by(SetLogDB.created_at.desc())
            .limit(1)
        )
        return session.execute(stmt).scalar_one_or_none()

    @staticmethod
    def get_best_set_from_previous_workouts(
        session: Session,
        user_id: str,
        exercise_id: int,
        current_workout_id: str,
    ) -> SetLogDB | None:
        stmt = (
            select(SetLogDB)
            .where(
                SetLogDB.user_id == user_id,
                SetLogDB.exercise_id == exercise_id,
                SetLogDB.workout_id != current_workout_id,
            )
            .order_by(SetLogDB.weight.desc(), SetLogDB.reps.desc(), SetLogDB.created_at.desc())
            .limit(1)
        )
        return session.execute(stmt).scalar_one_or_none()

    @staticmethod
    def get_progress_points(session: Session, user_id: str, exercise_id: int) -> list[dict]:
        stmt = (
            select(
                SetLogDB.workout_id.label("workout_id"),
                func.min(SetLogDB.created_at).label("timestamp"),
                func.max(SetLogDB.weight).label("max_weight"),
                func.sum(SetLogDB.weight * SetLogDB.reps).label("volume"),
            )
            .where(SetLogDB.user_id == user_id, SetLogDB.exercise_id == exercise_id)
            .group_by(SetLogDB.workout_id)
            .order_by(func.min(SetLogDB.created_at).asc())
        )
        rows = session.execute(stmt).all()
        return [
            {
                "workout_id": row.workout_id,
                "timestamp": row.timestamp,
                "max_weight": float(row.max_weight or 0),
                "volume": float(row.volume or 0),
            }
            for row in rows
        ]

    @staticmethod
    def get_latest_set_for_exercise(session: Session, exercise_id: int) -> SetLogDB | None:
        stmt = select(SetLogDB).where(SetLogDB.exercise_id == exercise_id).order_by(SetLogDB.created_at.desc()).limit(1)
        return session.execute(stmt).scalar_one_or_none()

    @staticmethod
    def list_recent_workout_ids(
        session: Session,
        user_id: str,
        *,
        limit: int = 5,
        exclude_workout_id: str | None = None,
    ) -> list[str]:
        stmt = select(WorkoutSessionDB.id).where(WorkoutSessionDB.user_id == user_id).order_by(WorkoutSessionDB.start_time.desc())
        if exclude_workout_id:
            stmt = stmt.where(WorkoutSessionDB.id != exclude_workout_id)
        stmt = stmt.limit(limit)
        return [item for item in session.execute(stmt).scalars().all()]

    @staticmethod
    def count_workouts_with_exercise(
        session: Session,
        user_id: str,
        exercise_id: int,
        workout_ids: Iterable[str],
    ) -> int:
        workout_ids_list = list(workout_ids)
        if not workout_ids_list:
            return 0
        stmt = (
            select(func.count(func.distinct(SetLogDB.workout_id)))
            .where(
                SetLogDB.user_id == user_id,
                SetLogDB.exercise_id == exercise_id,
                SetLogDB.workout_id.in_(workout_ids_list),
            )
        )
        result = session.execute(stmt).scalar_one_or_none()
        return int(result or 0)
