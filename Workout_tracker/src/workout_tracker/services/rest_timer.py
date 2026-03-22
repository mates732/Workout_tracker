# services/rest_timer.py
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class RestTimerState:
    default_seconds: int
    remaining_seconds: int


def start_rest_timer(default_seconds: int) -> RestTimerState:
    """Start a rest timer with validation."""
    if default_seconds <= 0:
        raise ValueError("default_seconds must be positive")
    return RestTimerState(default_seconds=default_seconds, remaining_seconds=default_seconds)


def skip_rest(timer: RestTimerState) -> RestTimerState:
    """Skip current rest period."""
    timer.remaining_seconds = 0
    return timer


def extend_rest(timer: RestTimerState, extra_seconds: int) -> RestTimerState:
    """Extend rest period by extra seconds."""
    if extra_seconds <= 0:
        raise ValueError("extra_seconds must be positive")
    timer.remaining_seconds += extra_seconds
    return timer
