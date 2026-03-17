from __future__ import annotations

import hmac

from fastapi import Header, HTTPException

from core.settings import settings


def require_bearer_token(authorization: str | None = Header(default=None)) -> str:
    """Validate a static bearer token using timing-safe comparison.

    This is a secure local-development placeholder. Replace with JWT validation
    against trusted issuer for production.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")

    token = authorization.removeprefix("Bearer ").strip()
    if not hmac.compare_digest(token, settings.api_token):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return token
