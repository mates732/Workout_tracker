from __future__ import annotations

from dataclasses import dataclass


@dataclass
class GroqClient:
    model: str = "llama-3.1-70b-versatile"

    def infer(self, prompt: str) -> str:
        return f"[Groq:{self.model}] {prompt[:180]}"


@dataclass
class GeminiClient:
    model: str = "gemini-1.5-pro"

    def infer(self, prompt: str) -> str:
        return f"[Gemini:{self.model}] {prompt[:240]}"
