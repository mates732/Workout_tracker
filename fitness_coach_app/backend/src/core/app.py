from __future__ import annotations

from fastapi import FastAPI

from core.settings import settings
from middleware.rate_limit import RateLimitMiddleware, SlidingWindowRateLimiter
from routes.workout_routes import router as workout_router

app = FastAPI(title="Fitness Coach API", version="1.0.0")
app.include_router(workout_router)
app.add_middleware(
    RateLimitMiddleware,
    limiter=SlidingWindowRateLimiter(
        max_requests=settings.rate_limit_requests,
        window_seconds=settings.rate_limit_window_seconds,
    ),
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
