from __future__ import annotations

import hmac

from fastapi import Header, HTTPException

from vpulz_platform.backend.utils.config import settings


def require_api_key(x_api_key: str | None = Header(default=None)) -> str:
    if not x_api_key or not hmac.compare_digest(x_api_key, settings.api_key):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return x_api_key
