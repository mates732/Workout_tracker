from __future__ import annotations

import hmac

try:
    from fastapi import Header, HTTPException
except ModuleNotFoundError:  # pragma: no cover - fallback for non-api test envs
    class HTTPException(Exception):
        def __init__(self, status_code: int, detail: str):
            super().__init__(detail)
            self.status_code = status_code
            self.detail = detail

    def Header(default=None):  # type: ignore
        return default

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
