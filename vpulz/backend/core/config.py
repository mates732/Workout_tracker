from __future__ import annotations

from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    app_name: str = "VPULZ API"
    env: str = os.getenv("VPULZ_ENV", "development")
    host: str = os.getenv("VPULZ_HOST", "0.0.0.0")
    port: int = int(os.getenv("VPULZ_PORT", "8100"))
    api_key: str = os.getenv("VPULZ_API_KEY", "dev-key")

    postgres_dsn: str = os.getenv("VPULZ_POSTGRES_DSN", "postgresql://postgres:postgres@localhost:5432/vpulz")
    vector_dsn: str = os.getenv("VPULZ_VECTOR_DSN", "qdrant://localhost:6333")

    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")


settings = Settings()
