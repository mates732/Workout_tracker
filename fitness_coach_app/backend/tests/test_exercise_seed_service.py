from __future__ import annotations

from pathlib import Path

from sqlalchemy import select

from core.database import create_database_engine, create_session_factory
from models.exercise_db import ExerciseDB
from services.exercise_seed_service import seed_exercises_from_csv


def test_seed_exercises_from_csv_is_idempotent(tmp_path: Path) -> None:
    csv_path = tmp_path / "exercises.csv"
    csv_path.write_text(
        "\n".join(
            [
                "id,name,category,equipment,primary_muscle,instructions",
                "1,Push Up,bodyweight,none,chest,Standard push up",
                "2,Squat,free weights,barbell,legs,Barbell squat",
                "3,push up,bodyweight,none,chest,Duplicate by name",
                "4,,bodyweight,none,chest,Missing name",
            ]
        ),
        encoding="utf-8",
    )
    database_url = f"sqlite:///{tmp_path / 'seed.db'}"

    first = seed_exercises_from_csv(str(csv_path), database_url=database_url)
    second = seed_exercises_from_csv(str(csv_path), database_url=database_url)

    assert first.inserted == 2
    assert first.skipped == 2
    assert first.total_rows == 4

    assert second.inserted == 0
    assert second.skipped == 4
    assert second.total_rows == 4


def test_seed_exercises_maps_fields_from_csv(tmp_path: Path) -> None:
    csv_path = tmp_path / "exercises.csv"
    csv_path.write_text(
        "\n".join(
            [
                "id,name,equipment,primary_muscle,instructions",
                "1,Deadlift,barbell,posterior chain,Lift barbell from floor",
            ]
        ),
        encoding="utf-8",
    )
    database_url = f"sqlite:///{tmp_path / 'seed-fields.db'}"

    result = seed_exercises_from_csv(str(csv_path), database_url=database_url)
    assert result.inserted == 1

    engine = create_database_engine(database_url)
    session_factory = create_session_factory(engine)
    try:
        with session_factory() as session:
            exercise = session.execute(select(ExerciseDB)).scalar_one()
            assert exercise.name == "Deadlift"
            assert exercise.muscle_group == "posterior chain"
            assert exercise.equipment == "barbell"
            assert exercise.instructions == "Lift barbell from floor"
    finally:
        engine.dispose()

