from __future__ import annotations

from typing import Any
from uuid import uuid4

from vpulz_platform.backend.integrations.wger_client import WgerClient
from vpulz_platform.backend.models.exercise_entities import Exercise, ExerciseAIMetadata
from vpulz_platform.backend.database.exercise_repository import ExerciseRepository


class WgerIntegrationService:
    """Service for integrating Wger exercises into the internal exercise library."""

    # Mapping of Wger movement category names to internal movement patterns
    MOVEMENT_PATTERN_MAPPING = {
        "Barbell": "push",
        "Dumbbell": "push",
        "Bodyweight": "calisthenics",
        "Cable": "push",
        "Machine": "machine",
        "Kettlebell": "swing",
        "EZ Curl Bar": "curl",
        "Medicine Ball": "explosive",
        "Foam roller": "mobility",
        "Other": "other",
    }

    # Mapping of Wger muscle IDs to internal muscle group names
    MUSCLE_MAPPING = {
        1: "chest",
        2: "back",
        3: "shoulders",
        4: "biceps",
        5: "triceps",
        6: "forearms",
        7: "abs",
        8: "quads",
        9: "hamstrings",
        10: "glutes",
        11: "calves",
        12: "lats",
        13: "traps",
    }

    DIFFICULTY_MAPPING = {
        "beginner": "beginner",
        "intermediate": "intermediate",
        "advanced": "advanced",
    }

    def __init__(self, exercise_repo: ExerciseRepository):
        self.wger_client = WgerClient()
        self.exercise_repo = exercise_repo

    def sync_wger_exercises(self) -> dict[str, Any]:
        """Sync all exercises from Wger API into the internal exercise repository."""
        try:
            wger_exercises = self.wger_client.fetch_all_exercises()
            synced_count = 0
            failed_count = 0
            errors = []

            for wger_exercise in wger_exercises:
                try:
                    exercise = self._convert_wger_to_internal(wger_exercise)
                    if exercise:
                        self.exercise_repo.upsert_system_exercise(exercise)
                        # Add default AI metadata if not present
                        if exercise.id not in self.exercise_repo.ai_metadata:
                            self._add_default_ai_metadata(exercise)
                        synced_count += 1
                except Exception as e:
                    failed_count += 1
                    errors.append(f"Exercise '{wger_exercise.get('name', 'unknown')}': {str(e)}")

            return {
                "status": "success",
                "synced": synced_count,
                "failed": failed_count,
                "total": len(wger_exercises),
                "errors": errors[:10],  # Return first 10 errors
            }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e),
                "synced": 0,
                "failed": 0,
            }

    def sync_specific_exercises(self, muscle_group: str | None = None, equipment: str | None = None) -> dict[str, Any]:
        """Sync exercises filtered by muscle group and/or equipment."""
        try:
            wger_exercises = self.wger_client.fetch_all_exercises()

            # Filter exercises if criteria provided
            if muscle_group or equipment:
                filtered_exercises = []
                for ex in wger_exercises:
                    if muscle_group and self._has_muscle(ex, muscle_group):
                        filtered_exercises.append(ex)
                    elif equipment and equipment.lower() in ex.get("name", "").lower():
                        filtered_exercises.append(ex)
                wger_exercises = filtered_exercises

            synced_count = 0
            for wger_exercise in wger_exercises:
                try:
                    exercise = self._convert_wger_to_internal(wger_exercise)
                    if exercise:
                        self.exercise_repo.upsert_system_exercise(exercise)
                        if exercise.id not in self.exercise_repo.ai_metadata:
                            self._add_default_ai_metadata(exercise)
                        synced_count += 1
                except Exception:
                    continue

            return {
                "status": "success",
                "synced": synced_count,
                "filters": {"muscle_group": muscle_group, "equipment": equipment},
            }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e),
            }

    def _convert_wger_to_internal(self, wger_exercise: dict[str, Any]) -> Exercise | None:
        """Convert a Wger exercise to internal Exercise model."""
        try:
            # Extract basic information
            name = wger_exercise.get("name", "").strip()
            if not name:
                return None

            exercise_id = str(wger_exercise.get("id", str(uuid4())))
            description = wger_exercise.get("description", "")

            # Try to get equipment and movement pattern
            equipment_type = "other"
            if wger_exercise.get("equipment"):
                equipment_id = wger_exercise["equipment"][0] if isinstance(wger_exercise["equipment"], list) else wger_exercise["equipment"]
                equipment_type = f"wger_{equipment_id}"

            # Get primary muscle
            muscles = wger_exercise.get("muscles", [])
            primary_muscle = "general"
            if muscles:
                muscle_id = muscles[0] if isinstance(muscles, list) else muscles
                primary_muscle = self.MUSCLE_MAPPING.get(muscle_id, "general")

            # Determine movement pattern
            movement_pattern = self._determine_movement_pattern(wger_exercise)

            # Determine difficulty
            difficulty_level = self._determine_difficulty(wger_exercise)

            # Determine if compound
            is_compound = len(muscles) > 1 if muscles else False

            return Exercise(
                id=f"wger_{exercise_id}",
                name=name,
                slug=name.lower().replace(" ", "-"),
                primary_muscle=primary_muscle,
                movement_pattern=movement_pattern,
                equipment_type=equipment_type,
                difficulty_level=difficulty_level,
                is_compound=is_compound,
                description=description,
                instructions=self._extract_instructions(wger_exercise),
                source_type="system",
                tags=self._extract_tags(wger_exercise),
            )
        except Exception as e:
            raise ValueError(f"Failed to convert Wger exercise: {e}") from e

    def _determine_movement_pattern(self, wger_exercise: dict[str, Any]) -> str:
        """Determine movement pattern from exercise data."""
        name = wger_exercise.get("name", "").lower()

        # Pattern matching based on exercise name
        if any(word in name for word in ["press", "bench", "overhead"]):
            return "push"
        elif any(word in name for word in ["row", "pull", "pull-up"]):
            return "pull"
        elif any(word in name for word in ["squat", "leg"]):
            return "squat"
        elif any(word in name for word in ["curl", "bicep"]):
            return "curl"
        elif any(word in name for word in ["extension", "tricep"]):
            return "extension"
        elif any(word in name for word in ["deadlift", "lift"]):
            return "deadlift"
        elif any(word in name for word in ["dip"]):
            return "dip"
        else:
            return "other"

    def _determine_difficulty(self, wger_exercise: dict[str, Any]) -> str:
        """Determine difficulty level from exercise data."""
        # Default to intermediate if no clear indicators
        return "intermediate"

    def _extract_instructions(self, wger_exercise: dict[str, Any]) -> list[str]:
        """Extract step-by-step instructions from exercise data."""
        instructions = []
        if wger_exercise.get("description"):
            # Split description into sentences as rough instructions
            description = wger_exercise["description"]
            sentences = [s.strip() for s in description.split(".") if s.strip()]
            instructions = sentences[:5]  # Limit to 5 instructions
        return instructions

    def _extract_tags(self, wger_exercise: dict[str, Any]) -> set[str]:
        """Extract relevant tags for the exercise."""
        tags = {"wger"}  # Mark as from Wger source

        # Add compound/isolation tag
        muscles = wger_exercise.get("muscles", [])
        if isinstance(muscles, list) and len(muscles) > 1:
            tags.add("compound")
        else:
            tags.add("isolation")

        # Add muscle-based tags
        name = wger_exercise.get("name", "").lower()
        if "upper" in name:
            tags.add("upper-body")
        if "lower" in name:
            tags.add("lower-body")
        if "core" in name or "abs" in name:
            tags.add("core")

        return tags

    def _has_muscle(self, exercise: dict[str, Any], muscle_group: str) -> bool:
        """Check if exercise targets specific muscle group."""
        muscles = exercise.get("muscles", [])
        target_muscle = self.MUSCLE_MAPPING.get(muscle_group, muscle_group)
        return any(self.MUSCLE_MAPPING.get(m, "general") == target_muscle for m in muscles)

    def _add_default_ai_metadata(self, exercise: Exercise) -> None:
        """Add default AI metadata for newly synced exercises."""
        # Estimate fatigue score based on exercise characteristics
        fatigue_score = 5
        if exercise.is_compound:
            fatigue_score += 2

        skill_requirement = 3  # Medium by default
        if "advanced" in exercise.tags:
            skill_requirement = 5

        injury_risk = 2  # Low by default
        if exercise.movement_pattern in ["deadlift", "squat"]:
            injury_risk += 2

        metadata = ExerciseAIMetadata(
            exercise_id=exercise.id,
            fatigue_score=min(fatigue_score, 10),
            skill_requirement=min(skill_requirement, 10),
            injury_risk=min(injury_risk, 10),
            recommended_rep_range="[6,12]",
            movement_pattern=exercise.movement_pattern,
        )
        self.exercise_repo.add_ai_metadata(metadata)

    def search_wger_exercises(self, query: str) -> dict[str, Any]:
        """Search for exercises in the synced Wger library."""
        results = []
        query_lower = query.lower()

        for exercise in self.exercise_repo.exercises.values():
            if "wger" in exercise.tags:
                if query_lower in exercise.name.lower() or query_lower in exercise.description.lower():
                    results.append(
                        {
                            "id": exercise.id,
                            "name": exercise.name,
                            "muscle": exercise.primary_muscle,
                            "equipment": exercise.equipment_type,
                            "movement_pattern": exercise.movement_pattern,
                            "difficulty": exercise.difficulty_level,
                        }
                    )

        return {
            "query": query,
            "results": results[:50],  # Limit to 50 results
            "count": len(results),
        }
