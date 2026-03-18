from __future__ import annotations

import csv
import os
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from core.database import Base, SessionLocal, create_database_engine, create_session_factory, engine
from core.settings import settings
from models.exercise_db import ExerciseDB


@dataclass(frozen=True)
class ExerciseSeedResult:
    inserted: int
    skipped: int
    total_rows: int


def _normalized(value: str | None) -> str:
    return (value or "").strip()


def _resolve_muscle_group(row: dict[str, str]) -> str:
    muscle_group = _normalized(row.get("muscle_group")) or _normalized(row.get("primary_muscle"))
    return muscle_group or "unknown"


def _seed_with_session(csv_path: str, session_factory: sessionmaker[Session], bind_engine: Engine) -> ExerciseSeedResult:
    Base.metadata.create_all(bind=bind_engine)

    inserted = 0
    skipped = 0
    total_rows = 0
    with session_factory() as session:
        existing_names = {
            name.strip().lower()
            for name in session.execute(select(ExerciseDB.name)).scalars().all()
            if name and name.strip()
        }

        with open(csv_path, newline="", encoding="utf-8-sig") as source:
            reader = csv.DictReader(source)
            for row in reader:
                total_rows += 1
                name = _normalized(row.get("name"))
                if not name:
                    skipped += 1
                    continue

                normalized_name = name.lower()
                if normalized_name in existing_names:
                    skipped += 1
                    continue

                session.add(
                    ExerciseDB(
                        name=name,
                        muscle_group=_resolve_muscle_group(row),
                        equipment=_normalized(row.get("equipment")),
                        instructions=_normalized(row.get("instructions")),
                    )
                )
                existing_names.add(normalized_name)
                inserted += 1
        session.commit()
    return ExerciseSeedResult(inserted=inserted, skipped=skipped, total_rows=total_rows)


def seed_exercises_from_csv(csv_path: str, database_url: str | None = None) -> ExerciseSeedResult:
    resolved_csv_path = os.path.abspath(csv_path)
    if not os.path.isfile(resolved_csv_path):
        raise FileNotFoundError(f"CSV not found: {resolved_csv_path}")

    if database_url is None:
        return _seed_with_session(resolved_csv_path, SessionLocal, engine)

    temp_engine = create_database_engine(database_url)
    temp_session_factory = create_session_factory(temp_engine)
    try:
        return _seed_with_session(resolved_csv_path, temp_session_factory, temp_engine)
    finally:
        temp_engine.dispose()


def migrate_exercises_from_default_csv() -> ExerciseSeedResult:
    return seed_exercises_from_csv(settings.exercises_csv_path)

