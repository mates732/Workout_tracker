from __future__ import annotations

from hashlib import sha256


def hash_value(value: str) -> str:
    """Hash helper for sensitive value fingerprinting."""
    if not value:
        raise ValueError("value cannot be empty")
    return sha256(value.encode("utf-8")).hexdigest()
