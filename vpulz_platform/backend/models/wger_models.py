from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class WgerExerciseData:
    """Model for persisting Wger exercise data."""
    wger_id: int
    name: str
    description: str
    images: list[str] = field(default_factory=list)
    videos: list[str] = field(default_factory=list)
    muscles_primary: list[int] = field(default_factory=list)
    muscles_secondary: list[int] = field(default_factory=list)
    equipment: list[int] = field(default_factory=list)
    category_id: int | None = None
    category_name: str = ""
    license_id: int | None = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    synced_at: datetime = field(default_factory=datetime.utcnow)
    raw_data: dict[str, Any] = field(default_factory=dict)


@dataclass
class WgerMuscle:
    """Model for Wger muscle data."""
    wger_id: int
    name: str
    name_en: str
    is_front: bool
    synced_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class WgerEquipment:
    """Model for Wger equipment data."""
    wger_id: int
    name: str
    synced_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class WgerCategory:
    """Model for Wger exercise category."""
    wger_id: int
    name: str
    synced_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class SyncStatus:
    """Status of Wger data synchronization."""
    last_sync: datetime | None = None
    total_exercises: int = 0
    total_muscles: int = 0
    total_equipment: int = 0
    total_categories: int = 0
    sync_in_progress: bool = False
    last_error: str | None = None
    last_sync_duration_seconds: float = 0.0
