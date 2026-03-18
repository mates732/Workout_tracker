from __future__ import annotations

from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    env: str = os.getenv("VPULZ_ENV", "development")
    api_key: str = os.getenv("VPULZ_API_KEY", "dev-key")
    postgres_dsn: str = os.getenv("VPULZ_POSTGRES_DSN", "postgresql://postgres:postgres@localhost:5432/vpulz")
    motia_base_url: str = os.getenv("MOTIA_BASE_URL", "")
    motia_api_key: str = os.getenv("MOTIA_API_KEY", "")
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")


settings = Settings()
