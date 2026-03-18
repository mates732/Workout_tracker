from __future__ import annotations

from fastapi import FastAPI

from core.database import Base, engine
from core.settings import settings
from middleware.rate_limit import RateLimitMiddleware, SlidingWindowRateLimiter

import models.exercise_db  # noqa: F401
import models.tracker_db  # noqa: F401
from routes.workout_routes import exercise_router, legacy_router, progress_router, session_router, set_router
from services.exercise_seed_service import migrate_exercises_from_default_csv

app = FastAPI(title="Workout Tracker API", version="2.0.0")
app.include_router(session_router)
app.include_router(exercise_router)
app.include_router(set_router)
app.include_router(progress_router)
app.include_router(legacy_router)
app.add_middleware(
    RateLimitMiddleware,
    limiter=SlidingWindowRateLimiter(
        max_requests=settings.rate_limit_requests,
        window_seconds=settings.rate_limit_window_seconds,
    ),
)


@app.on_event("startup")
def bootstrap_database() -> None:
    Base.metadata.create_all(bind=engine)
    if settings.seed_exercises_on_startup:
        try:
            migrate_exercises_from_default_csv()
        except FileNotFoundError:
            # Allow startup without seed file in containerized deployments.
            pass


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
