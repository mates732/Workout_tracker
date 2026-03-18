from __future__ import annotations

from vpulz_platform.backend.database.profile_repository import UserProfileRepository
from vpulz_platform.backend.models.entities import UserProfile


class ProfileService:
    def __init__(self, repo: UserProfileRepository):
        self.repo = repo

    def get_profile(self, user_id: str) -> UserProfile:
        if not user_id.strip():
            raise ValueError("user_id is required")
        return self.repo.get_or_create(user_id)

    def update_profile(self, profile: UserProfile) -> UserProfile:
        if not profile.user_id.strip():
            raise ValueError("user_id is required")
        return self.repo.upsert(profile)
