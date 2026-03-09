from __future__ import annotations

from fastapi import FastAPI

from routes.workout_routes import router as workout_router

app = FastAPI(title="Fitness Coach API", version="1.0.0")
app.include_router(workout_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
