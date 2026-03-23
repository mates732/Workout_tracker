from __future__ import annotations

import json
from dataclasses import dataclass
from urllib import error, request

from fastapi import Header, HTTPException

from vpulz_platform.backend.utils.config import settings


@dataclass(frozen=True)
class AuthenticatedUser:
    id: str
    email: str


def _normalize_supabase_url(raw_url: str) -> str:
    return raw_url.rstrip("/")


def require_supabase_user(authorization: str | None = Header(default=None)) -> AuthenticatedUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    if not settings.supabase_url or not settings.supabase_anon_key:
        raise HTTPException(status_code=503, detail="Supabase auth is not configured")

    token = authorization.split(" ", 1)[1].strip()
    req = request.Request(
        f"{_normalize_supabase_url(settings.supabase_url)}/auth/v1/user",
        method="GET",
        headers={
            "Authorization": f"Bearer {token}",
            "apikey": settings.supabase_anon_key,
            "Accept": "application/json",
        },
    )

    try:
        with request.urlopen(req, timeout=4) as response:
            raw = response.read().decode("utf-8")
            payload = json.loads(raw) if raw else {}
    except (error.HTTPError, error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=401, detail="Invalid Supabase token") from exc

    user_id = payload.get("id")
    email = payload.get("email")
    if not user_id or not email:
        raise HTTPException(status_code=401, detail="Invalid Supabase user payload")

    return AuthenticatedUser(id=str(user_id), email=str(email))
