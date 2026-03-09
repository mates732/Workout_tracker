from __future__ import annotations

from collections import defaultdict, deque
from dataclasses import dataclass, field
from time import time

try:
    from fastapi import Request
    from starlette.middleware.base import BaseHTTPMiddleware
    from starlette.responses import JSONResponse, Response
except ModuleNotFoundError:  # pragma: no cover - fallback for test environments
    Request = object  # type: ignore

    class Response:  # type: ignore
        pass

    class JSONResponse(Response):  # type: ignore
        def __init__(self, status_code: int, content: dict):
            self.status_code = status_code
            self.content = content

    class BaseHTTPMiddleware:  # type: ignore
        def __init__(self, app):
            self.app = app


@dataclass
class SlidingWindowRateLimiter:
    """In-memory sliding-window limiter keyed by client IP."""

    max_requests: int
    window_seconds: int
    _events: dict[str, deque[float]] = field(default_factory=lambda: defaultdict(deque))

    def allow(self, key: str, now: float | None = None) -> bool:
        if not key:
            raise ValueError("key is required")
        ts = now if now is not None else time()
        bucket = self._events[key]
        cutoff = ts - self.window_seconds
        while bucket and bucket[0] < cutoff:
            bucket.popleft()
        if len(bucket) >= self.max_requests:
            return False
        bucket.append(ts)
        return True


class RateLimitMiddleware(BaseHTTPMiddleware):
    """ASGI middleware wrapper around SlidingWindowRateLimiter."""

    def __init__(self, app, limiter: SlidingWindowRateLimiter):  # type: ignore[no-untyped-def]
        super().__init__(app)
        self.limiter = limiter

    async def dispatch(self, request, call_next):  # type: ignore[no-untyped-def]
        client = getattr(request, "client", None)
        key = client.host if client else "unknown"
        if not self.limiter.allow(key):
            return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"})
        return await call_next(request)
