from __future__ import annotations

from fastapi import Header, HTTPException


def require_bearer_token(authorization: str | None = Header(default=None)) -> str:
    """Simple auth guard placeholder for JWT middleware integration."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return authorization.removeprefix("Bearer ")
