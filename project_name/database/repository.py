"""In-memory repository stubs for local development."""

from dataclasses import dataclass, field


@dataclass
class InMemoryRepository:
    items: list[dict] = field(default_factory=list)

    def add(self, payload: dict) -> None:
        self.items.append(payload)

    def list(self) -> list[dict]:
        return list(self.items)
