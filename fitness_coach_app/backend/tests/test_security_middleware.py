from middleware.auth import require_bearer_token
from middleware.rate_limit import SlidingWindowRateLimiter


def test_auth_rejects_wrong_token() -> None:
    try:
        require_bearer_token("Bearer wrong-token")
    except Exception as exc:  # fastapi HTTPException
        assert getattr(exc, "status_code", None) == 401
    else:
        raise AssertionError("Expected unauthorized exception")


def test_sliding_window_rate_limiter() -> None:
    limiter = SlidingWindowRateLimiter(max_requests=2, window_seconds=10)
    assert limiter.allow("ip1", now=100.0) is True
    assert limiter.allow("ip1", now=101.0) is True
    assert limiter.allow("ip1", now=102.0) is False
    assert limiter.allow("ip1", now=111.0) is True
