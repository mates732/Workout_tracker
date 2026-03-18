from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy import delete

from core.app import app
from core.database import SessionLocal
from core.settings import settings
from models.tracker_db import SetLogDB, WorkoutExerciseDB, WorkoutSessionDB

client = TestClient(app)


def _auth_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {settings.api_token}"}


def setup_function() -> None:
    with SessionLocal.begin() as session:
        session.execute(delete(SetLogDB))
        session.execute(delete(WorkoutExerciseDB))
        session.execute(delete(WorkoutSessionDB))


def test_session_lifecycle_and_set_logging_flow() -> None:
    started = client.post("/workout/start", headers=_auth_headers(), json={"user_id": "api-user"})
    assert started.status_code == 200
    workout_id = started.json()["workout"]["id"]
    assert started.json()["resumed"] is False

    active = client.get("/workout/active", headers=_auth_headers(), params={"user_id": "api-user"})
    assert active.status_code == 200
    assert active.json()["workout"]["id"] == workout_id

    added = client.post(
        f"/workout/{workout_id}/exercise",
        headers=_auth_headers(),
        json={"exercise_name": "Barbell Bench Press"},
    )
    assert added.status_code == 200
    exercise_id = added.json()["exercise"]["exercise_id"]

    logged = client.post(
        "/set",
        headers=_auth_headers(),
        json={
            "workout_id": workout_id,
            "exercise_id": exercise_id,
            "weight": 100,
            "reps": 5,
            "rpe": 8.5,
        },
    )
    assert logged.status_code == 200
    payload = logged.json()
    assert payload["set"]["volume"] == 500
    assert "suggestion" in payload
    assert payload["suggestion"]["next_weight_kg"] == 102.5

    state = client.get(f"/workout/{workout_id}", headers=_auth_headers())
    assert state.status_code == 200
    assert len(state.json()["workout"]["exercises"]) == 1

    progress = client.get(f"/progress/{exercise_id}", headers=_auth_headers(), params={"user_id": "api-user"})
    assert progress.status_code == 200
    assert progress.json()["exercise_id"] == exercise_id
    assert len(progress.json()["weight_over_time"]) == 1

    progress_auto_user = client.get(f"/progress/{exercise_id}", headers=_auth_headers())
    assert progress_auto_user.status_code == 200
    assert progress_auto_user.json()["user_id"] == "api-user"

    finished = client.post(f"/workout/{workout_id}/finish", headers=_auth_headers())
    assert finished.status_code == 200
    assert finished.json()["workout"]["status"] == "finished"


def test_patch_set_updates_values() -> None:
    started = client.post("/workout/start", headers=_auth_headers(), json={"user_id": "api-user-2"})
    workout_id = started.json()["workout"]["id"]
    added = client.post(
        f"/workout/{workout_id}/exercise",
        headers=_auth_headers(),
        json={"exercise_name": "Barbell Bench Press"},
    )
    exercise_id = added.json()["exercise"]["exercise_id"]

    logged = client.post(
        "/set",
        headers=_auth_headers(),
        json={
            "workout_id": workout_id,
            "exercise_id": exercise_id,
            "weight": 90,
            "reps": 6,
            "rpe": 8.0,
        },
    )
    set_id = logged.json()["set"]["id"]

    patched = client.patch(
        f"/set/{set_id}",
        headers=_auth_headers(),
        json={"weight": 92.5, "reps": 5, "rpe": 8.5},
    )
    assert patched.status_code == 200
    assert patched.json()["set"]["weight"] == 92.5
    assert patched.json()["set"]["reps"] == 5
