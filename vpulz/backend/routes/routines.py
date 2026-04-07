from __future__ import annotations

from fastapi import APIRouter

from backend.models.domain import UserProfile
from backend.repositories.memory_repo import RoutineRepository
from backend.schemas.api import CreateRoutineRequest
from backend.services.routines import RoutineService

router = APIRouter(prefix="/routines", tags=["routines"])
repo = RoutineRepository()
service = RoutineService(repo)


@router.post("")
def create_routine(payload: CreateRoutineRequest) -> dict:
    routine = service.create_routine(payload.user_id, payload.name, payload.split)
    return {"routine_id": routine.routine_id, "name": routine.name, "split": routine.split}


@router.post("/{routine_id}/exercise")
def add_exercise_to_routine(routine_id: str, exercise_name: str) -> dict:
    routine = service.add_exercise_to_routine(routine_id, exercise_name)
    return {"routine_id": routine.routine_id, "exercise_count": len(routine.exercises)}


@router.post("/generate")
def generate_routine_from_goal(user_id: str, goal: str, experience: str, equipment: list[str] | None = None) -> dict:
    profile = UserProfile(user_id=user_id, goal=goal, experience=experience, equipment=equipment or [])
    routine = service.generate_routine_from_goal(profile)
    return {"routine_id": routine.routine_id, "split": routine.split, "exercises": routine.exercises}
