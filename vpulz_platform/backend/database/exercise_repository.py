from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from difflib import SequenceMatcher
from uuid import uuid4

from vpulz_platform.backend.models.exercise_entities import (
    DuplicateCandidate,
    Exercise,
    ExerciseAIMetadata,
    SearchFilters,
)


@dataclass
class ExerciseRepository:
    exercises: dict[str, Exercise] = field(default_factory=dict)
    ai_metadata: dict[str, ExerciseAIMetadata] = field(default_factory=dict)
    recent_by_user: dict[str, list[tuple[str, str, datetime]]] = field(default_factory=lambda: defaultdict(list))
    favorites_by_user: dict[str, set[tuple[str, str]]] = field(default_factory=lambda: defaultdict(set))

    def upsert_system_exercise(self, exercise: Exercise) -> Exercise:
        self.exercises[exercise.id] = exercise
        return exercise

    def create_user_exercise(self, exercise: Exercise) -> Exercise:
        self.exercises[exercise.id] = exercise
        return exercise

    def get_exercise(self, exercise_id: str) -> Exercise:
        return self.exercises[exercise_id]

    def add_ai_metadata(self, metadata: ExerciseAIMetadata) -> None:
        self.ai_metadata[metadata.exercise_id] = metadata

    def mark_recent(self, user_id: str, exercise_id: str, source_type: str) -> None:
        now = datetime.utcnow()
        entries = [entry for entry in self.recent_by_user[user_id] if not (entry[0] == exercise_id and entry[1] == source_type)]
        entries.insert(0, (exercise_id, source_type, now))
        self.recent_by_user[user_id] = entries[:25]

    def toggle_favorite(self, user_id: str, exercise_id: str, source_type: str) -> bool:
        key = (exercise_id, source_type)
        favorites = self.favorites_by_user[user_id]
        if key in favorites:
            favorites.remove(key)
            return False
        favorites.add(key)
        return True

    def search(self, filters: SearchFilters) -> list[Exercise]:
        candidates = []
        query = filters.query.strip().lower()
        query_terms = query.split() if query else []

        favorite_keys = self.favorites_by_user[filters.user_id]
        allowed_recent = {
            (exercise_id, source)
            for exercise_id, source, _ in self.recent_by_user[filters.user_id]
        }

        for exercise in self.exercises.values():
            if exercise.source_type == "user" and exercise.owner_user_id != filters.user_id:
                continue

            if filters.muscle and exercise.primary_muscle != filters.muscle:
                continue
            if filters.equipment and exercise.equipment_type != filters.equipment:
                continue
            if filters.movement_pattern and exercise.movement_pattern != filters.movement_pattern:
                continue
            if filters.difficulty_level and exercise.difficulty_level != filters.difficulty_level:
                continue
            if filters.tags and not set(filters.tags).issubset(exercise.tags):
                continue
            key = (exercise.id, exercise.source_type)
            if filters.only_favorites and key not in favorite_keys:
                continue

            score = 0.0
            if query_terms:
                lowered_name = exercise.name.lower()
                full_similarity = SequenceMatcher(None, query, lowered_name).ratio()
                token_hits = sum(1 for term in query_terms if term in lowered_name)
                score += full_similarity * 0.7 + min(1.0, token_hits / max(len(query_terms), 1)) * 0.3
            else:
                score += 0.2

            if key in favorite_keys:
                score += 0.2
            if filters.include_recent and key in allowed_recent:
                score += 0.15

            candidates.append((score, exercise.updated_at, exercise))

        candidates.sort(key=lambda item: (item[0], item[1]), reverse=True)
        return [exercise for _, _, exercise in candidates[: filters.limit]]

    def find_duplicates(self, user_id: str, name: str, primary_muscle: str, equipment: str, movement_pattern: str) -> list[DuplicateCandidate]:
        lowered_name = name.strip().lower()
        candidates: list[DuplicateCandidate] = []
        for exercise in self.exercises.values():
            if exercise.source_type == "user" and exercise.owner_user_id != user_id:
                continue

            name_similarity = SequenceMatcher(None, lowered_name, exercise.name.lower()).ratio()
            muscle_match = 1.0 if exercise.primary_muscle == primary_muscle else 0.0
            equipment_match = 1.0 if exercise.equipment_type == equipment else 0.0
            pattern_match = 1.0 if exercise.movement_pattern == movement_pattern else 0.0
            score = (0.5 * name_similarity) + (0.25 * muscle_match) + (0.15 * equipment_match) + (0.10 * pattern_match)

            if score >= 0.62:
                candidates.append(
                    DuplicateCandidate(
                        exercise_id=exercise.id,
                        name=exercise.name,
                        source_type=exercise.source_type,
                        score=round(score, 3),
                    )
                )

        candidates.sort(key=lambda row: row.score, reverse=True)
        return candidates[:5]

    @staticmethod
    def build_slug(name: str) -> str:
        compact = "-".join(name.lower().split())
        slug = "".join(char for char in compact if char.isalnum() or char == "-")
        return slug.strip("-") or str(uuid4())
