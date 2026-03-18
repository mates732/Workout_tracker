from __future__ import annotations

from dataclasses import dataclass, field

from vpulz_platform.backend.models.entities import UserProfile


@dataclass
class UserProfileRepository:
    store: dict[str, UserProfile] = field(default_factory=dict)

    def get(self, user_id: str) -> UserProfile:
        return self.store[user_id]

    def get_or_create(self, user_id: str) -> UserProfile:
        profile = self.store.get(user_id)
        if profile is None:
            profile = UserProfile(user_id=user_id, goal="strength", level="intermediate", equipment=["barbell", "dumbbell"])
            self.store[user_id] = profile
        return profile

    def upsert(self, profile: UserProfile) -> UserProfile:
        self.store[profile.user_id] = profile
        return profile
