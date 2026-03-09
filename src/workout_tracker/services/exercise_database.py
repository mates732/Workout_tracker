from __future__ import annotations

import csv
from pathlib import Path
from typing import List

from workout_tracker.core.models import ExerciseDefinition, ExerciseType


class ExerciseDatabase:
    def load_from_csv(self, csv_path: str) -> List[ExerciseDefinition]:
        path = Path(csv_path)
        exercises: List[ExerciseDefinition] = []
        with path.open(newline="") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                category = row["category"]
                if category in ("compound", "secondary_compound"):
                    exercise_type = ExerciseType.COMPOUND
                elif category == "isolation":
                    exercise_type = ExerciseType.ISOLATION
                else:
                    exercise_type = ExerciseType.HYPERTROPHY

                exercises.append(
                    ExerciseDefinition(
                        name=row["name"],
                        target_muscles=[row["primary_muscle"]],
                        exercise_type=exercise_type,
                        movement_pattern=row["movement_pattern"],
                        equipment=row["equipment"],
                        difficulty=row["difficulty"],
                        category=category,
                        instructions=row["instructions"],
                        video_url=row.get("video_url", ""),
                    )
                )
        return exercises
