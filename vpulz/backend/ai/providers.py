from __future__ import annotations

from dataclasses import dataclass


class ModelProvider:
    def generate(self, prompt: str) -> str:  # pragma: no cover - interface
        raise NotImplementedError


@dataclass
class FastInferenceProvider(ModelProvider):
    """Groq/Llama placeholder provider adapter."""

    model_name: str = "llama-3.1-70b-versatile"

    def generate(self, prompt: str) -> str:
        return f"[fast:{self.model_name}] {prompt[:180]}"


@dataclass
class ReasoningProvider(ModelProvider):
    """Gemini reasoning provider adapter placeholder."""

    model_name: str = "gemini-1.5-pro"

    def generate(self, prompt: str) -> str:
        return f"[reasoning:{self.model_name}] {prompt[:250]}"
