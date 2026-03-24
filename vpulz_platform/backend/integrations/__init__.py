"""Integration services for third-party APIs and platforms."""

from __future__ import annotations

from vpulz_platform.backend.integrations.wger_client import WgerClient
from vpulz_platform.backend.integrations.wger_service import WgerIntegrationService

__all__ = ["WgerClient", "WgerIntegrationService"]
