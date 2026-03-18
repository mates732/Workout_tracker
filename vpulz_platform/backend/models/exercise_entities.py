from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Literal

ActivationLevel = Literal["primary", "secondary", "stabilizer"]
DifficultyLevel = Literal["beginner", "intermediate", "advanced"]
SourceType = Literal["system", "user"]


@dataclass
class Exercise:
    id: str
    name: str
    slug: str
    primary_muscle: str
    movement_pattern: str
    equipment_type: str
    difficulty_level: DifficultyLevel
    is_compound: bool
    description: str
    instructions: list[str] = field(default_factory=list)
    source_type: SourceType = "system"
    owner_user_id: str | None = None
    tags: set[str] = field(default_factory=set)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class MuscleActivation:
    exercise_id: str
    muscle_id: str
    activation_level: ActivationLevel


@dataclass
class ExerciseAIMetadata:
    exercise_id: str
    fatigue_score: int
    skill_requirement: int
    injury_risk: int
    recommended_rep_range: str
    movement_pattern: str


@dataclass
class DuplicateCandidate:
    exercise_id: str
    name: str
    source_type: SourceType
    score: float


@dataclass
class SearchFilters:
    user_id: str
    query: str = ""
    muscle: str | None = None
    equipment: str | None = None
    movement_pattern: str | None = None
    difficulty_level: DifficultyLevel | None = None
    tags: list[str] = field(default_factory=list)
    only_favorites: bool = False
    include_recent: bool = True
    limit: int = 25


@dataclass
class CreateUserExercisePayload:
    user_id: str
    name: str
    primary_muscle: str
    equipment: str
    movement_pattern: str
    notes: str = ""
    is_private: bool = True
