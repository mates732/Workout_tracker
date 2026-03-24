from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from vpulz_platform.backend.models.wger_models import (
    WgerExerciseData,
    WgerMuscle,
    WgerEquipment,
    WgerCategory,
    SyncStatus,
)


@dataclass
class WgerRepository:
    """Repository for managing Wger data persistence."""

    exercises: dict[int, WgerExerciseData] = field(default_factory=dict)
    muscles: dict[int, WgerMuscle] = field(default_factory=dict)
    equipment: dict[int, WgerEquipment] = field(default_factory=dict)
    categories: dict[int, WgerCategory] = field(default_factory=dict)
    sync_status: SyncStatus = field(default_factory=SyncStatus)

    # Indexed for fast lookup
    exercise_by_name: dict[str, int] = field(default_factory=dict)
    exercises_by_muscle: dict[int, list[int]] = field(default_factory=lambda: defaultdict(list))
    exercises_by_equipment: dict[int, list[int]] = field(default_factory=lambda: defaultdict(list))
    exercises_by_category: dict[int, list[int]] = field(default_factory=lambda: defaultdict(list))

    def save_exercise(self, exercise: WgerExerciseData) -> None:
        """Save or update a Wger exercise."""
        self.exercises[exercise.wger_id] = exercise
        self.exercise_by_name[exercise.name.lower()] = exercise.wger_id

        # Index by muscles
        for muscle_id in exercise.muscles_primary + exercise.muscles_secondary:
            if exercise.wger_id not in self.exercises_by_muscle[muscle_id]:
                self.exercises_by_muscle[muscle_id].append(exercise.wger_id)

        # Index by equipment
        for equip_id in exercise.equipment:
            if exercise.wger_id not in self.exercises_by_equipment[equip_id]:
                self.exercises_by_equipment[equip_id].append(equip_id)

        # Index by category
        if exercise.category_id:
            if exercise.wger_id not in self.exercises_by_category[exercise.category_id]:
                self.exercises_by_category[exercise.category_id].append(exercise.wger_id)

    def get_exercise(self, wger_id: int) -> WgerExerciseData | None:
        """Retrieve exercise by Wger ID."""
        return self.exercises.get(wger_id)

    def get_exercise_by_name(self, name: str) -> WgerExerciseData | None:
        """Retrieve exercise by name (case-insensitive)."""
        wger_id = self.exercise_by_name.get(name.lower())
        return self.exercises.get(wger_id) if wger_id else None

    def get_exercises_by_muscle(self, muscle_id: int) -> list[WgerExerciseData]:
        """Get all exercises targeting a specific muscle."""
        wger_ids = self.exercises_by_muscle.get(muscle_id, [])
        return [self.exercises[wid] for wid in wger_ids if wid in self.exercises]

    def get_exercises_by_equipment(self, equipment_id: int) -> list[WgerExerciseData]:
        """Get all exercises using specific equipment."""
        wger_ids = self.exercises_by_equipment.get(equipment_id, [])
        return [self.exercises[wid] for wid in wger_ids if wid in self.exercises]

    def get_exercises_by_category(self, category_id: int) -> list[WgerExerciseData]:
        """Get all exercises in a category."""
        wger_ids = self.exercises_by_category.get(category_id, [])
        return [self.exercises[wid] for wid in wger_ids if wid in self.exercises]

    def search_exercises(self, query: str) -> list[WgerExerciseData]:
        """Search exercises by name or description."""
        query_lower = query.lower()
        results = []

        for exercise in self.exercises.values():
            if (query_lower in exercise.name.lower() or
                query_lower in exercise.description.lower()):
                results.append(exercise)

        return results

    def save_muscle(self, muscle: WgerMuscle) -> None:
        """Save or update a muscle group."""
        self.muscles[muscle.wger_id] = muscle

    def get_muscle(self, muscle_id: int) -> WgerMuscle | None:
        """Retrieve muscle by ID."""
        return self.muscles.get(muscle_id)

    def get_all_muscles(self) -> list[WgerMuscle]:
        """Get all muscles."""
        return list(self.muscles.values())

    def save_equipment(self, equipment: WgerEquipment) -> None:
        """Save or update equipment."""
        self.equipment[equipment.wger_id] = equipment

    def get_equipment(self, equipment_id: int) -> WgerEquipment | None:
        """Retrieve equipment by ID."""
        return self.equipment.get(equipment_id)

    def get_all_equipment(self) -> list[WgerEquipment]:
        """Get all equipment."""
        return list(self.equipment.values())

    def save_category(self, category: WgerCategory) -> None:
        """Save or update category."""
        self.categories[category.wger_id] = category

    def get_category(self, category_id: int) -> WgerCategory | None:
        """Retrieve category by ID."""
        return self.categories.get(category_id)

    def get_all_categories(self) -> list[WgerCategory]:
        """Get all categories."""
        return list(self.categories.values())

    def get_statistics(self) -> dict[str, Any]:
        """Get repository statistics."""
        return {
            "total_exercises": len(self.exercises),
            "total_muscles": len(self.muscles),
            "total_equipment": len(self.equipment),
            "total_categories": len(self.categories),
            "last_sync": self.sync_status.last_sync.isoformat() if self.sync_status.last_sync else None,
            "sync_in_progress": self.sync_status.sync_in_progress,
            "last_error": self.sync_status.last_error,
        }

    def clear_all(self) -> None:
        """Clear all data (use for fresh sync)."""
        self.exercises.clear()
        self.muscles.clear()
        self.equipment.clear()
        self.categories.clear()
        self.exercise_by_name.clear()
        self.exercises_by_muscle.clear()
        self.exercises_by_equipment.clear()
        self.exercises_by_category.clear()
