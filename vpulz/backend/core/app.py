from __future__ import annotations

from fastapi import FastAPI

from backend.routes.assistant import router as assistant_router
from backend.routes.routines import router as routines_router
from backend.routes.workouts import router as workouts_router

app = FastAPI(title="VPULZ API", version="1.0.0")
app.include_router(workouts_router)
app.include_router(routines_router)
app.include_router(assistant_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
