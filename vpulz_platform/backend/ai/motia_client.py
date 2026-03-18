from __future__ import annotations

from dataclasses import dataclass
import json
from typing import Any
from urllib import error, request


@dataclass
class MotiaClient:
    base_url: str = ""
    api_key: str = ""
    timeout_seconds: int = 2

    def infer_exercise_metadata(self, payload: dict[str, Any]) -> dict[str, Any]:
        if not self.base_url:
            return self._fallback_metadata(payload)
        return self._post_json("/v1/exercise/classify", payload, fallback=self._fallback_metadata(payload))

    def compare_exercise_similarity(self, payload: dict[str, Any]) -> dict[str, Any]:
        if not self.base_url:
            return {"semantic_similarity": 0.0}
        return self._post_json("/v1/exercise/similarity", payload, fallback={"semantic_similarity": 0.0})

    def _post_json(self, path: str, payload: dict[str, Any], fallback: dict[str, Any]) -> dict[str, Any]:
        body = json.dumps(payload).encode("utf-8")
        url = f"{self.base_url.rstrip('/')}{path}"
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        req = request.Request(url, data=body, headers=headers, method="POST")
        try:
            with request.urlopen(req, timeout=self.timeout_seconds) as response:
                raw = response.read().decode("utf-8")
                parsed = json.loads(raw) if raw else {}
                return parsed if isinstance(parsed, dict) else fallback
        except (error.URLError, error.HTTPError, TimeoutError, json.JSONDecodeError):
            return fallback

    @staticmethod
    def _fallback_metadata(payload: dict[str, Any]) -> dict[str, Any]:
        name = str(payload.get("name", "")).lower()
        movement_pattern = str(payload.get("movement_pattern", "isolation")) or "isolation"
        difficulty = "beginner"
        fatigue_score = 4
        skill_requirement = 3
        injury_risk = 3
        tags = ["strength"]

        compound_keywords = ("press", "squat", "deadlift", "row", "pull-up", "lunge")
        if any(k in name for k in compound_keywords):
            difficulty = "intermediate"
            fatigue_score = 7
            skill_requirement = 6
            injury_risk = 5
            tags = ["strength", "hypertrophy"]

        if "jump" in name or "snatch" in name or "clean" in name:
            tags.append("explosive")
            difficulty = "advanced"
            skill_requirement = 8
            injury_risk = 7

        return {
            "movement_pattern": movement_pattern,
            "difficulty_level": difficulty,
            "fatigue_score": fatigue_score,
            "skill_requirement": skill_requirement,
            "injury_risk": injury_risk,
            "recommended_rep_range": "6-12",
            "tags": tags,
            "muscle_activation": [
                {"muscle_id": payload.get("primary_muscle", "core"), "activation_level": "primary"}
            ],
        }
