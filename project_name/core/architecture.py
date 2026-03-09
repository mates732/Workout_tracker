"""Core architecture contracts for the product scaffold."""

from dataclasses import dataclass


@dataclass(frozen=True)
class ServiceDescriptor:
    name: str
    responsibility: str
