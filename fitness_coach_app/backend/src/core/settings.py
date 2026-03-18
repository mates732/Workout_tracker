from __future__ import annotations

from dataclasses import dataclass
import os


def _default_database_url() -> str:
    database_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "database", "app.db")
    )
    return f"sqlite:///{database_path}"


def _default_exercises_csv_path() -> str:
    return os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data", "exercises.csv")
    )


@dataclass(frozen=True)
class Settings:
    env: str = os.getenv("APP_ENV", "development")
    host: str = os.getenv("APP_HOST", "0.0.0.0")
    port: int = int(os.getenv("APP_PORT", "8000"))
    jwt_secret: str = os.getenv("JWT_SECRET", "change-me")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    api_token: str = os.getenv("API_TOKEN", "dev-token")
    rate_limit_requests: int = int(os.getenv("RATE_LIMIT_REQUESTS", "120"))
    rate_limit_window_seconds: int = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
    database_url: str = os.getenv("DATABASE_URL", _default_database_url())
    exercises_csv_path: str = os.getenv("EXERCISES_CSV_PATH", _default_exercises_csv_path())
    seed_exercises_on_startup: bool = os.getenv("SEED_EXERCISES_ON_STARTUP", "true").lower() in {
        "1",
        "true",
        "yes",
    }


settings = Settings()
