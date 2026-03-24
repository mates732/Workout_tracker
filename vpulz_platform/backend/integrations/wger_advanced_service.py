from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from vpulz_platform.backend.integrations.wger_client import WgerClient
from vpulz_platform.backend.database.wger_repository import WgerRepository
from vpulz_platform.backend.models.wger_models import (
    WgerExerciseData,
    WgerMuscle,
    WgerEquipment,
    WgerCategory,
)

logger = logging.getLogger(__name__)


class WgerAdvancedService:
    """Advanced service for comprehensive Wger integration and management."""

    def __init__(self, wger_repo: WgerRepository, wger_client: WgerClient | None = None):
        self.repo = wger_repo
        self.client = wger_client or WgerClient()
        logger.info("Initialized WgerAdvancedService")

    def sync_all_data(self, progress_callback=None) -> dict[str, Any]:
        """Perform comprehensive sync of all Wger data.
        
        Args:
            progress_callback: Optional callable for progress reporting
            
        Returns:
            Dictionary with sync statistics
        """
        logger.info("Starting comprehensive Wger sync")
        start_time = datetime.utcnow()

        try:
            self.repo.sync_status.sync_in_progress = True
            self.repo.sync_status.last_error = None

            # Sync reference data
            logger.info("Syncing reference data (muscles, equipment, categories)")
            self._sync_muscles()
            self._sync_equipment()
            self._sync_categories()

            # Sync exercises
            logger.info("Syncing exercises")
            exercises_synced = self._sync_exercises(progress_callback)

            # Update sync status
            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()

            self.repo.sync_status.last_sync = datetime.utcnow()
            self.repo.sync_status.total_exercises = len(self.repo.exercises)
            self.repo.sync_status.total_muscles = len(self.repo.muscles)
            self.repo.sync_status.total_equipment = len(self.repo.equipment)
            self.repo.sync_status.total_categories = len(self.repo.categories)
            self.repo.sync_status.sync_in_progress = False
            self.repo.sync_status.last_sync_duration_seconds = duration

            logger.info(
                f"Sync completed in {duration:.2f}s. "
                f"Exercises: {exercises_synced}, "
                f"Muscles: {len(self.repo.muscles)}, "
                f"Equipment: {len(self.repo.equipment)}, "
                f"Categories: {len(self.repo.categories)}"
            )

            return {
                "status": "success",
                "exercises_synced": exercises_synced,
                "muscles_synced": len(self.repo.muscles),
                "equipment_synced": len(self.repo.equipment),
                "categories_synced": len(self.repo.categories),
                "duration_seconds": duration,
                "timestamp": self.repo.sync_status.last_sync.isoformat(),
            }

        except Exception as e:
            logger.error(f"Sync failed: {e}")
            self.repo.sync_status.sync_in_progress = False
            self.repo.sync_status.last_error = str(e)
            return {
                "status": "error",
                "message": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }

    def _sync_muscles(self) -> None:
        """Sync muscle groups from Wger."""
        try:
            data = self.client.get_muscles()
            muscles = data.get("results", [])
            logger.info(f"Fetched {len(muscles)} muscles from Wger")

            for muscle_data in muscles:
                muscle = WgerMuscle(
                    wger_id=muscle_data["id"],
                    name=muscle_data.get("name", ""),
                    name_en=muscle_data.get("name_en", muscle_data.get("name", "")),
                    is_front=muscle_data.get("is_front", False),
                )
                self.repo.save_muscle(muscle)

            logger.info(f"Saved {len(muscles)} muscles to repository")
        except Exception as e:
            logger.error(f"Failed to sync muscles: {e}")
            raise

    def _sync_equipment(self) -> None:
        """Sync equipment from Wger."""
        try:
            data = self.client.get_equipment()
            equipment_list = data.get("results", [])
            logger.info(f"Fetched {len(equipment_list)} equipment types from Wger")

            for equip_data in equipment_list:
                equipment = WgerEquipment(
                    wger_id=equip_data["id"],
                    name=equip_data.get("name", ""),
                )
                self.repo.save_equipment(equipment)

            logger.info(f"Saved {len(equipment_list)} equipment to repository")
        except Exception as e:
            logger.error(f"Failed to sync equipment: {e}")
            raise

    def _sync_categories(self) -> None:
        """Sync exercise categories from Wger."""
        try:
            data = self.client.get_exercise_categories()
            categories = data.get("results", [])
            logger.info(f"Fetched {len(categories)} categories from Wger")

            for cat_data in categories:
                category = WgerCategory(
                    wger_id=cat_data["id"],
                    name=cat_data.get("name", ""),
                )
                self.repo.save_category(category)

            logger.info(f"Saved {len(categories)} categories to repository")
        except Exception as e:
            logger.error(f"Failed to sync categories: {e}")
            raise

    def _sync_exercises(self, progress_callback=None) -> int:
        """Sync exercises from Wger."""
        try:
            exercises = self.client.fetch_all_exercises(progress_callback=progress_callback)
            logger.info(f"Fetched {len(exercises)} exercises from Wger")

            synced = 0
            for exercise_data in exercises:
                try:
                    exercise = self._convert_wger_exercise(exercise_data)
                    if exercise:
                        self.repo.save_exercise(exercise)
                        synced += 1
                except Exception as e:
                    logger.warning(f"Failed to convert exercise {exercise_data.get('id')}: {e}")
                    continue

            logger.info(f"Saved {synced} exercises to repository")
            return synced
        except Exception as e:
            logger.error(f"Failed to sync exercises: {e}")
            raise

    def _convert_wger_exercise(self, wger_data: dict[str, Any]) -> WgerExerciseData | None:
        """Convert Wger exercise data to internal model."""
        try:
            exercise = WgerExerciseData(
                wger_id=wger_data["id"],
                name=wger_data.get("name", ""),
                description=wger_data.get("description", ""),
                muscles_primary=wger_data.get("muscles", []),
                muscles_secondary=wger_data.get("muscles_secondary", []),
                equipment=wger_data.get("equipment", []),
                category_id=wger_data.get("category"),
                raw_data=wger_data,
            )

            # Add category name if available
            if exercise.category_id:
                category = self.repo.get_category(exercise.category_id)
                if category:
                    exercise.category_name = category.name

            return exercise
        except Exception as e:
            logger.error(f"Error converting Wger exercise: {e}")
            raise

    def search_advanced(
        self,
        query: str | None = None,
        muscle_ids: list[int] | None = None,
        equipment_ids: list[int] | None = None,
        category_id: int | None = None,
        limit: int = 50,
    ) -> dict[str, Any]:
        """Advanced search with multiple filters.
        
        Args:
            query: Text search query
            muscle_ids: Filter by primary/secondary muscles
            equipment_ids: Filter by equipment
            category_id: Filter by category
            limit: Max results to return
            
        Returns:
            Dictionary with search results
        """
        logger.debug(f"Advanced search: query={query}, muscles={muscle_ids}, equipment={equipment_ids}")

        # Start with all exercises if no filters
        if not any([query, muscle_ids, equipment_ids, category_id]):
            results = list(self.repo.exercises.values())[:limit]
            return {"results": self._serialize_exercises(results), "count": len(results)}

        # Text search
        if query:
            results = self.repo.search_exercises(query)
        else:
            results = list(self.repo.exercises.values())

        # Filter by muscle
        if muscle_ids:
            muscle_exercises = set()
            for muscle_id in muscle_ids:
                muscle_exercises.update(
                    ex.wger_id for ex in self.repo.get_exercises_by_muscle(muscle_id)
                )
            results = [ex for ex in results if ex.wger_id in muscle_exercises]

        # Filter by equipment
        if equipment_ids:
            equip_exercises = set()
            for equip_id in equipment_ids:
                equip_exercises.update(
                    ex.wger_id for ex in self.repo.get_exercises_by_equipment(equip_id)
                )
            results = [ex for ex in results if ex.wger_id in equip_exercises]

        # Filter by category
        if category_id:
            results = [
                ex for ex in results if ex.category_id == category_id
            ]

        # Limit results
        results = results[:limit]

        logger.debug(f"Search returned {len(results)} results")
        return {
            "results": self._serialize_exercises(results),
            "count": len(results),
            "filters": {
                "query": query,
                "muscle_ids": muscle_ids,
                "equipment_ids": equipment_ids,
                "category_id": category_id,
            },
        }

    def get_exercise_recommendations(
        self, primary_muscle: int, limit: int = 10
    ) -> dict[str, Any]:
        """Get exercise recommendations for a muscle."""
        exercises = self.repo.get_exercises_by_muscle(primary_muscle)[:limit]
        muscle = self.repo.get_muscle(primary_muscle)

        return {
            "muscle_id": primary_muscle,
            "muscle_name": muscle.name if muscle else "Unknown",
            "exercises": self._serialize_exercises(exercises),
            "count": len(exercises),
        }

    def get_all_muscles_with_exercises(self) -> dict[str, Any]:
        """Get all muscles with exercise counts."""
        data = []
        for muscle in self.repo.get_all_muscles():
            exercises = self.repo.get_exercises_by_muscle(muscle.wger_id)
            data.append({
                "muscle_id": muscle.wger_id,
                "muscle_name": muscle.name,
                "exercise_count": len(exercises),
            })

        return {
            "muscles": data,
            "total_muscles": len(data),
        }

    def get_all_equipment_with_exercises(self) -> dict[str, Any]:
        """Get all equipment with exercise counts."""
        data = []
        for equip in self.repo.get_all_equipment():
            exercises = self.repo.get_exercises_by_equipment(equip.wger_id)
            data.append({
                "equipment_id": equip.wger_id,
                "equipment_name": equip.name,
                "exercise_count": len(exercises),
            })

        return {
            "equipment": data,
            "total_equipment": len(data),
        }

    def _serialize_exercises(self, exercises: list[WgerExerciseData]) -> list[dict[str, Any]]:
        """Convert exercises to serializable format."""
        return [
            {
                "wger_id": ex.wger_id,
                "name": ex.name,
                "description": ex.description[:200],  # Limit description length
                "muscles_primary": ex.muscles_primary,
                "muscles_secondary": ex.muscles_secondary,
                "equipment": ex.equipment,
                "category_id": ex.category_id,
                "category_name": ex.category_name,
                "synced_at": ex.synced_at.isoformat(),
            }
            for ex in exercises
        ]

    def get_sync_status(self) -> dict[str, Any]:
        """Get current sync status."""
        return {
            "last_sync": self.repo.sync_status.last_sync.isoformat() if self.repo.sync_status.last_sync else None,
            "total_exercises": self.repo.sync_status.total_exercises,
            "total_muscles": self.repo.sync_status.total_muscles,
            "total_equipment": self.repo.sync_status.total_equipment,
            "total_categories": self.repo.sync_status.total_categories,
            "sync_in_progress": self.repo.sync_status.sync_in_progress,
            "last_error": self.repo.sync_status.last_error,
            "last_sync_duration_seconds": self.repo.sync_status.last_sync_duration_seconds,
        }
