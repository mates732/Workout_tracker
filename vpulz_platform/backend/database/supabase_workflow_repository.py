from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
import json
from typing import Any
from urllib import error, parse, request
from uuid import uuid4

from vpulz_platform.backend.utils.config import settings


class SupabaseRepositoryError(RuntimeError):
    pass


@dataclass(frozen=True)
class WorkoutSessionRecord:
    id: str
    user_id: str
    date: str
    duration: int | None
    notes: str
    created_at: str


def _iso_now() -> str:
    return datetime.utcnow().isoformat()


def _base_url() -> str:
    return settings.supabase_url.rstrip("/")


class SupabaseWorkflowRepository:
    schema: str = "app_core"

    def _headers(self, prefer: str | None = None) -> dict[str, str]:
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise SupabaseRepositoryError("Supabase REST is not configured")

        headers = {
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if prefer:
            headers["Prefer"] = prefer
        return headers

    def _request(
        self,
        method: str,
        table: str,
        *,
        params: dict[str, str] | None = None,
        body: Any | None = None,
        prefer: str | None = None,
    ) -> list[dict[str, Any]]:
        query = ""
        if params:
            query = "?" + parse.urlencode(params)

        url = f"{_base_url()}/rest/v1/{self.schema}.{table}{query}"
        payload = None if body is None else json.dumps(body).encode("utf-8")

        req = request.Request(
            url,
            method=method,
            data=payload,
            headers=self._headers(prefer=prefer),
        )

        try:
            with request.urlopen(req, timeout=8) as response:
                raw = response.read().decode("utf-8")
                if not raw:
                    return []
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    return parsed
                if isinstance(parsed, dict):
                    return [parsed]
                return []
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8") if hasattr(exc, "read") else str(exc)
            raise SupabaseRepositoryError(f"Supabase HTTP error: {detail}") from exc
        except (error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            raise SupabaseRepositoryError("Supabase request failed") from exc

    def ensure_user(self, user_id: str, email: str) -> None:
        self._request(
            "POST",
            "users",
            body={"id": user_id, "email": email},
            prefer="resolution=merge-duplicates,return=minimal",
        )

    def active_workout_by_user(self, user_id: str) -> WorkoutSessionRecord | None:
        rows = self._request(
            "GET",
            "workouts",
            params={
                "select": "id,user_id,date,duration,notes,created_at",
                "user_id": f"eq.{user_id}",
                "duration": "is.null",
                "order": "created_at.desc",
                "limit": "1",
            },
        )
        if not rows:
            return None
        row = rows[0]
        return WorkoutSessionRecord(
            id=str(row["id"]),
            user_id=str(row["user_id"]),
            date=str(row["date"]),
            duration=row.get("duration"),
            notes=str(row.get("notes") or ""),
            created_at=str(row.get("created_at") or _iso_now()),
        )

    def create_workout(self, user_id: str, workout_date: str, notes: str) -> WorkoutSessionRecord:
        workout_id = str(uuid4())
        rows = self._request(
            "POST",
            "workouts",
            body={
                "id": workout_id,
                "user_id": user_id,
                "date": workout_date,
                "duration": None,
                "notes": notes,
                "created_at": _iso_now(),
                "updated_at": _iso_now(),
            },
            prefer="return=representation",
        )
        row = rows[0]
        return WorkoutSessionRecord(
            id=str(row["id"]),
            user_id=str(row["user_id"]),
            date=str(row["date"]),
            duration=row.get("duration"),
            notes=str(row.get("notes") or ""),
            created_at=str(row.get("created_at") or _iso_now()),
        )

    def find_or_create_exercise(self, name: str, muscle_group: str, equipment: str) -> str:
        found = self._request(
            "GET",
            "exercises",
            params={
                "select": "id",
                "name": f"eq.{name}",
                "limit": "1",
            },
        )
        if found:
            return str(found[0]["id"])

        exercise_id = str(uuid4())
        rows = self._request(
            "POST",
            "exercises",
            body={
                "id": exercise_id,
                "name": name,
                "muscle_group": muscle_group,
                "equipment": equipment,
                "created_at": _iso_now(),
            },
            prefer="return=representation",
        )
        return str(rows[0]["id"])

    def next_order_index(self, workout_id: str) -> int:
        rows = self._request(
            "GET",
            "workout_exercises",
            params={
                "select": "order_index",
                "workout_id": f"eq.{workout_id}",
                "order": "order_index.desc",
                "limit": "1",
            },
        )
        if not rows:
            return 0
        return int(rows[0].get("order_index") or 0) + 1

    def attach_exercise_to_workout(self, workout_id: str, exercise_id: str, order_index: int) -> str:
        workout_exercise_id = str(uuid4())
        rows = self._request(
            "POST",
            "workout_exercises",
            body={
                "id": workout_exercise_id,
                "workout_id": workout_id,
                "exercise_id": exercise_id,
                "order_index": order_index,
                "created_at": _iso_now(),
            },
            prefer="return=representation",
        )
        return str(rows[0]["id"])

    def create_default_set(self, workout_exercise_id: str) -> str:
        set_id = str(uuid4())
        rows = self._request(
            "POST",
            "sets",
            body={
                "id": set_id,
                "workout_exercise_id": workout_exercise_id,
                "weight": 0,
                "reps": 0,
                "type": "normal",
                "completed": False,
                "created_at": _iso_now(),
                "updated_at": _iso_now(),
            },
            prefer="return=representation",
        )
        return str(rows[0]["id"])

    def complete_set(self, set_id: str, weight: float, reps: int, set_type: str) -> None:
        self._request(
            "PATCH",
            "sets",
            params={"id": f"eq.{set_id}"},
            body={
                "weight": weight,
                "reps": reps,
                "type": set_type,
                "completed": True,
                "updated_at": _iso_now(),
            },
            prefer="return=minimal",
        )

    def finish_workout(self, workout_id: str, duration: int, notes: str | None) -> None:
        payload: dict[str, Any] = {
            "duration": duration,
            "updated_at": _iso_now(),
        }
        if notes is not None:
            payload["notes"] = notes

        self._request(
            "PATCH",
            "workouts",
            params={"id": f"eq.{workout_id}"},
            body=payload,
            prefer="return=minimal",
        )

    def get_workout(self, workout_id: str) -> WorkoutSessionRecord:
        rows = self._request(
            "GET",
            "workouts",
            params={
                "select": "id,user_id,date,duration,notes,created_at",
                "id": f"eq.{workout_id}",
                "limit": "1",
            },
        )
        if not rows:
            raise SupabaseRepositoryError("Workout not found")
        row = rows[0]
        return WorkoutSessionRecord(
            id=str(row["id"]),
            user_id=str(row["user_id"]),
            date=str(row["date"]),
            duration=row.get("duration"),
            notes=str(row.get("notes") or ""),
            created_at=str(row.get("created_at") or _iso_now()),
        )

    def upsert_calendar_entry(self, user_id: str, iso_date: str, status: str) -> None:
        self._request(
            "POST",
            "calendar_entries",
            body={
                "id": str(uuid4()),
                "user_id": user_id,
                "date": iso_date,
                "status": status,
                "updated_at": _iso_now(),
            },
            prefer="resolution=merge-duplicates,return=minimal",
        )

    def list_calendar(self, user_id: str) -> list[dict[str, Any]]:
        return self._request(
            "GET",
            "calendar_entries",
            params={
                "select": "id,date,status",
                "user_id": f"eq.{user_id}",
                "order": "date.asc",
            },
        )

    def upsert_training_plan(self, user_id: str, plan_type: str) -> str:
        rows = self._request(
            "POST",
            "training_plans",
            body={
                "id": str(uuid4()),
                "user_id": user_id,
                "type": plan_type,
                "updated_at": _iso_now(),
            },
            prefer="resolution=merge-duplicates,return=representation",
        )
        return str(rows[0]["id"])

    def populate_two_week_calendar(self, user_id: str, start_iso_date: str) -> list[str]:
        start = date.fromisoformat(start_iso_date)
        planned: list[str] = []
        for offset in range(14):
            current = start + timedelta(days=offset)
            if current.weekday() in (0, 2, 4):
                iso = current.isoformat()
                self.upsert_calendar_entry(user_id, iso, "planned")
                planned.append(iso)
        return planned

    def sync_payload(self, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        workouts = payload.get("workouts") or []
        calendar_entries = payload.get("calendar_entries") or []

        for workout in workouts:
            workout_row = {
                "id": workout.get("id", str(uuid4())),
                "user_id": user_id,
                "date": workout.get("date", datetime.utcnow().date().isoformat()),
                "duration": workout.get("duration"),
                "notes": workout.get("notes", ""),
                "created_at": workout.get("created_at", _iso_now()),
                "updated_at": _iso_now(),
            }
            self._request(
                "POST",
                "workouts",
                body=workout_row,
                prefer="resolution=merge-duplicates,return=minimal",
            )

        for entry in calendar_entries:
            self.upsert_calendar_entry(
                user_id=user_id,
                iso_date=str(entry.get("date")),
                status=str(entry.get("status", "planned")),
            )

        return {
            "workouts": self._request(
                "GET",
                "workouts",
                params={
                    "select": "id,date,duration,notes,updated_at",
                    "user_id": f"eq.{user_id}",
                    "order": "updated_at.desc",
                    "limit": "100",
                },
            ),
            "calendar_entries": self.list_calendar(user_id),
        }
