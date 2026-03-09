from __future__ import annotations

from fastapi import Depends, FastAPI

from vpulz_platform.backend.api.assistant import router as assistant_router
from vpulz_platform.backend.api.analytics import router as analytics_router
from vpulz_platform.backend.api.routines import router as routines_router
from vpulz_platform.backend.api.workouts import router as workouts_router
from vpulz_platform.backend.utils.security import require_api_key

app = FastAPI(title="VPULZ Core API", version="2.0.0")

app.include_router(workouts_router, dependencies=[Depends(require_api_key)])
app.include_router(routines_router, dependencies=[Depends(require_api_key)])
app.include_router(assistant_router, dependencies=[Depends(require_api_key)])
app.include_router(analytics_router, dependencies=[Depends(require_api_key)])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
