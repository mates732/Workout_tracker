from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class KnowledgeRetriever:
    """Simple in-memory retrieval placeholder for vector knowledge base."""

    snippets: list[str] = field(default_factory=lambda: [
        "Progressive overload should be gradual and technique-first.",
        "Deload when fatigue remains high and performance stalls.",
        "Compound lifts generally need longer rest periods.",
    ])

    def retrieve(self, query: str, limit: int = 2) -> list[str]:
        q = query.lower()
        ranked = sorted(self.snippets, key=lambda s: q in s.lower(), reverse=True)
        return ranked[:limit]
