"""Runtime settings dataclass."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    app_name: str = "AI Fitness Coach"
    environment: str = "development"
    default_theme: str = "dark"
