from __future__ import annotations

from dataclasses import asdict
from datetime import datetime
from typing import Any
from uuid import uuid4

from vpulz_platform.backend.ai.motia_client import MotiaClient
from vpulz_platform.backend.database.exercise_repository import ExerciseRepository
from vpulz_platform.backend.models.exercise_entities import (
    CreateUserExercisePayload,
    Exercise,
    ExerciseAIMetadata,
    SearchFilters,
)


class ExerciseService:
    def __init__(self, repo: ExerciseRepository, motia_client: MotiaClient):
        self.repo = repo
        self.motia_client = motia_client

    def seed_defaults(self) -> None:
        if self.repo.exercises:
            return

        seeds = [
            Exercise(
                id=str(uuid4()),
                name="Bench Press",
                slug="bench-press",
                primary_muscle="chest",
                movement_pattern="push",
                equipment_type="barbell",
                difficulty_level="intermediate",
                is_compound=True,
                description="Horizontal press for chest, delts, triceps.",
                tags={"strength", "hypertrophy"},
            ),
            Exercise(
                id=str(uuid4()),
                name="Goblet Squat",
                slug="goblet-squat",
                primary_muscle="quads",
                movement_pattern="squat",
                equipment_type="dumbbell",
                difficulty_level="beginner",
                is_compound=True,
                description="Beginner-friendly squat variation.",
                tags={"beginner", "strength"},
            ),
            Exercise(
                id=str(uuid4()),
                name="Cable Row",
                slug="cable-row",
                primary_muscle="lats",
                movement_pattern="pull",
                equipment_type="cable",
                difficulty_level="beginner",
                is_compound=True,
                description="Horizontal pulling movement.",
                tags={"hypertrophy"},
            ),
        ]

        for exercise in seeds:
            self.repo.upsert_system_exercise(exercise)
            self.repo.add_ai_metadata(
                ExerciseAIMetadata(
                    exercise_id=exercise.id,
                    fatigue_score=6,
                    skill_requirement=4,
                    injury_risk=3,
                    recommended_rep_range="[6,12]",
                    movement_pattern=exercise.movement_pattern,
                )
            )

    def search_exercises(self, filters: SearchFilters) -> list[dict[str, Any]]:
        self.seed_defaults()
        return [self._format_card(exercise, filters.user_id) for exercise in self.repo.search(filters)]

    def create_user_exercise(self, payload: CreateUserExercisePayload) -> dict[str, Any]:
        self.seed_defaults()
        if not payload.name.strip():
            raise ValueError("exercise name is required")

        duplicate_candidates = self.repo.find_duplicates(
            user_id=payload.user_id,
            name=payload.name,
            primary_muscle=payload.primary_muscle,
            equipment=payload.equipment,
            movement_pattern=payload.movement_pattern,
        )

        slug = self.repo.build_slug(payload.name)
        exercise = Exercise(
            id=str(uuid4()),
            name=payload.name.strip(),
            slug=slug,
            primary_muscle=payload.primary_muscle,
            movement_pattern=payload.movement_pattern,
            equipment_type=payload.equipment,
            difficulty_level="beginner",
            is_compound=False,
            description=payload.notes,
            source_type="user",
            owner_user_id=payload.user_id,
            tags={"custom"},
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        self.repo.create_user_exercise(exercise)
        self.repo.mark_recent(payload.user_id, exercise.id, exercise.source_type)

        ai_payload = {
            "name": exercise.name,
            "primary_muscle": exercise.primary_muscle,
            "equipment": exercise.equipment_type,
            "movement_pattern": exercise.movement_pattern,
            "notes": payload.notes,
        }
        ai_result = self.motia_client.infer_exercise_metadata(ai_payload)

        inferred_difficulty = str(ai_result.get("difficulty_level", exercise.difficulty_level))
        if inferred_difficulty in {"beginner", "intermediate", "advanced"}:
            exercise.difficulty_level = inferred_difficulty

        inferred_tags = ai_result.get("tags", [])
        if isinstance(inferred_tags, list):
            exercise.tags.update(str(tag) for tag in inferred_tags)

        self.repo.add_ai_metadata(
            ExerciseAIMetadata(
                exercise_id=exercise.id,
                fatigue_score=int(ai_result.get("fatigue_score", 5)),
                skill_requirement=int(ai_result.get("skill_requirement", 5)),
                injury_risk=int(ai_result.get("injury_risk", 4)),
                recommended_rep_range=str(ai_result.get("recommended_rep_range", "[8,12]")),
                movement_pattern=str(ai_result.get("movement_pattern", exercise.movement_pattern)),
            )
        )

        return {
            "exercise": self._format_card(exercise, payload.user_id),
            "duplicate_candidates": [asdict(candidate) for candidate in duplicate_candidates],
            "ai_metadata": asdict(self.repo.ai_metadata[exercise.id]),
        }

    def duplicate_check(self, user_id: str, name: str, primary_muscle: str, equipment: str, movement_pattern: str) -> list[dict[str, Any]]:
        self.seed_defaults()
        local_candidates = self.repo.find_duplicates(user_id, name, primary_muscle, equipment, movement_pattern)

        enriched = []
        for candidate in local_candidates:
            semantic = self.motia_client.compare_exercise_similarity(
                {
                    "new_exercise": {
                        "name": name,
                        "primary_muscle": primary_muscle,
                        "equipment": equipment,
                        "movement_pattern": movement_pattern,
                    },
                    "existing_exercise": {
                        "id": candidate.exercise_id,
                        "name": candidate.name,
                        "source_type": candidate.source_type,
                    },
                }
            )
            semantic_similarity = float(semantic.get("semantic_similarity", 0.0))
            combined_score = round(min(1.0, candidate.score * 0.85 + semantic_similarity * 0.15), 3)
            enriched.append(
                {
                    "exercise_id": candidate.exercise_id,
                    "name": candidate.name,
                    "source_type": candidate.source_type,
                    "score": combined_score,
                }
            )

        enriched.sort(key=lambda row: row["score"], reverse=True)
        return enriched

    def toggle_favorite(self, user_id: str, exercise_id: str) -> dict[str, Any]:
        exercise = self.repo.get_exercise(exercise_id)
        state = self.repo.toggle_favorite(user_id, exercise_id, exercise.source_type)
        return {"exercise_id": exercise_id, "is_favorite": state}

    def mark_recent(self, user_id: str, exercise_id: str) -> dict[str, str]:
        exercise = self.repo.get_exercise(exercise_id)
        self.repo.mark_recent(user_id, exercise_id, exercise.source_type)
        return {"status": "ok"}

    def _format_card(self, exercise: Exercise, user_id: str) -> dict[str, Any]:
        metadata = self.repo.ai_metadata.get(exercise.id)
        return {
            "id": exercise.id,
            "name": exercise.name,
            "slug": exercise.slug,
            "primary_muscle": exercise.primary_muscle,
            "movement_pattern": exercise.movement_pattern,
            "equipment": exercise.equipment_type,
            "difficulty_level": exercise.difficulty_level,
            "tags": sorted(exercise.tags),
            "source_type": exercise.source_type,
            "is_favorite": (exercise.id, exercise.source_type) in self.repo.favorites_by_user[user_id],
            "fatigue_score": metadata.fatigue_score if metadata else None,
            "injury_risk": metadata.injury_risk if metadata else None,
        }
