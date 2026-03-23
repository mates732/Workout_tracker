from __future__ import annotations

import json
from typing import Any
from urllib import error, request

from vpulz_platform.backend.utils.config import settings


def _truncate(text: str, limit: int = 2000) -> str:
    return text[:limit]


class AIService:
    def _prompt(self, question: str, context: dict[str, Any]) -> str:
        return _truncate(
            "\n".join(
                [
                    "You are VPULZ AI coach.",
                    "Give practical coaching guidance in short bullet points.",
                    f"Question: {question}",
                    f"Context: {json.dumps(context, ensure_ascii=False)}",
                ]
            )
        )

    def groq_provider(self, question: str, context: dict[str, Any]) -> str:
        if not settings.groq_api_key:
            raise RuntimeError("Missing GROQ_API_KEY")

        model = settings.groq_model
        body = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are a performance-focused strength coach."},
                {"role": "user", "content": self._prompt(question, context)},
            ],
            "temperature": 0.2,
            "max_tokens": 280,
        }

        req = request.Request(
            "https://api.groq.com/openai/v1/chat/completions",
            method="POST",
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.groq_api_key}",
            },
        )

        with request.urlopen(req, timeout=8) as response:
            payload = json.loads(response.read().decode("utf-8"))

        answer = payload.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        if not answer:
            raise RuntimeError("Groq empty response")
        return answer

    def gemini_provider(self, question: str, context: dict[str, Any]) -> str:
        if not settings.gemini_api_key:
            raise RuntimeError("Missing GEMINI_API_KEY")

        model = settings.gemini_model
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.gemini_api_key}"
        body = {
            "contents": [{"role": "user", "parts": [{"text": self._prompt(question, context)}]}],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 300,
            },
        }

        req = request.Request(
            url,
            method="POST",
            data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json"},
        )

        with request.urlopen(req, timeout=8) as response:
            payload = json.loads(response.read().decode("utf-8"))

        answer = (
            payload.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
            .strip()
        )
        if not answer:
            raise RuntimeError("Gemini empty response")
        return answer

    def fallback(self, question: str, context: dict[str, Any]) -> str:
        normalized = question.lower()
        if "deload" in normalized or "fatigue" in normalized:
            return "Take a 1-week deload: reduce load by 10-15% and keep movement quality high."
        if "progress" in normalized or "increase" in normalized:
            return "Progress one variable at a time: +1 rep or +2.5kg when reps stay clean."
        pending = context.get("pending_sync", 0)
        return f"Focus on execution quality today. Pending sync actions: {pending}."

    def answer(self, question: str, context: dict[str, Any]) -> dict[str, str]:
        providers = [provider.strip().lower() for provider in settings.ai_provider_order.split(",") if provider.strip()]
        if not providers:
            providers = ["groq", "gemini"]

        for provider in providers:
            try:
                if provider == "groq":
                    return {"provider": "groq", "answer": self.groq_provider(question, context)}
                if provider == "gemini":
                    return {"provider": "gemini", "answer": self.gemini_provider(question, context)}
            except (error.HTTPError, error.URLError, TimeoutError, RuntimeError, json.JSONDecodeError):
                continue

        return {"provider": "fallback", "answer": self.fallback(question, context)}
