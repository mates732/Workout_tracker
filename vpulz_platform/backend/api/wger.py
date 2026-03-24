"""Comprehensive Wger integration API endpoints."""

from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks

from vpulz_platform.backend.core.container import container
from vpulz_platform.backend.integrations.wger_advanced_service import WgerAdvancedService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/wger", tags=["wger-integration"])


def _get_service() -> WgerAdvancedService:
    """Get Wger service instance."""
    return WgerAdvancedService(container.wger_repo, container.wger_client)


@router.post("/sync")
def sync_wger_exercises(background_tasks: BackgroundTasks) -> dict:
    """Trigger full Wger data sync.
    
    Can be sync (blocking) or async via background tasks.
    Returns immediately, actual sync happens in background.
    """
    try:
        if container.wger_repo.sync_status.sync_in_progress:
            raise HTTPException(
                status_code=409,
                detail="Sync already in progress"
            )

        logger.info("Triggering Wger sync")
        service = _get_service()
        
        # Run sync in background
        background_tasks.add_task(service.sync_all_data)
        
        return {
            "status": "queued",
            "message": "Wger sync has been queued",
            "timestamp": container.wger_repo.sync_status.last_sync.isoformat() if container.wger_repo.sync_status.last_sync else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to queue Wger sync: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to queue sync: {str(e)}") from e


@router.post("/sync-blocking")
def sync_wger_exercises_blocking() -> dict:
    """Trigger full Wger data sync (blocking call).
    
    WARNING: This may take a while (30+ seconds).
    Useful for initial setup or maintenance operations.
    """
    try:
        if container.wger_repo.sync_status.sync_in_progress:
            raise HTTPException(
                status_code=409,
                detail="Sync already in progress"
            )

        logger.info("Starting blocking Wger sync")
        service = _get_service()
        result = service.sync_all_data()
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to sync Wger exercises: {e}")
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}") from e


@router.get("/search")
def search_exercises(
    query: str | None = Query(None),
    muscle_ids: list[int] = Query(None),
    equipment_ids: list[int] = Query(None),
    category_id: int | None = Query(None),
    limit: int = Query(50, ge=1, le=500),
) -> dict:
    """Advanced search for Wger exercises with multiple filters.
    
    Args:
        query: Text search in name/description
        muscle_ids: Filter by primary/secondary muscles (comma-separated)
        equipment_ids: Filter by equipment types (comma-separated)
        category_id: Filter by exercise category
        limit: Max results (1-500)
        
    Example:
        /wger/search?query=bench&muscle_ids=1,3&limit=20
    """
    try:
        service = _get_service()
        result = service.search_advanced(
            query=query,
            muscle_ids=muscle_ids,
            equipment_ids=equipment_ids,
            category_id=category_id,
            limit=limit,
        )
        return result
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}") from e


@router.get("/status")
def wger_sync_status() -> dict:
    """Get current Wger sync status and statistics."""
    try:
        service = _get_service()
        return service.get_sync_status()
    except Exception as e:
        logger.error(f"Failed to get sync status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}") from e


@router.get("/recommended/{muscle_id}")
def get_recommendations(
    muscle_id: int,
    limit: int = Query(10, ge=1, le=50),
) -> dict:
    """Get exercise recommendations for a specific muscle.
    
    Args:
        muscle_id: Wger muscle ID
        limit: Number of recommendations
    """
    try:
        service = _get_service()
        result = service.get_exercise_recommendations(muscle_id, limit)
        
        if not result.get("exercises"):
            raise HTTPException(
                status_code=404,
                detail=f"No exercises found for muscle {muscle_id}"
            )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get recommendations: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}") from e


@router.get("/muscles")
def get_all_muscles() -> dict:
    """Get all muscles with exercise counts."""
    try:
        service = _get_service()
        return service.get_all_muscles_with_exercises()
    except Exception as e:
        logger.error(f"Failed to get muscles: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get muscles: {str(e)}") from e


@router.get("/equipment")
def get_all_equipment() -> dict:
    """Get all equipment types with exercise counts."""
    try:
        service = _get_service()
        return service.get_all_equipment_with_exercises()
    except Exception as e:
        logger.error(f"Failed to get equipment: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get equipment: {str(e)}") from e


@router.get("/statistics")
def get_wger_statistics() -> dict:
    """Get Wger library statistics and cache info."""
    try:
        stats = container.wger_repo.get_statistics()
        cache_size = len(container.wger_client._cache)
        
        return {
            "library_statistics": stats,
            "cache": {
                "cached_entries": cache_size,
                "cache_ttl_seconds": container.wger_client.cache_ttl,
            },
            "last_updated": stats.get("last_sync"),
        }
    except Exception as e:
        logger.error(f"Failed to get statistics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}") from e


@router.post("/cache/clear")
def clear_cache() -> dict:
    """Clear Wger API client cache."""
    try:
        container.wger_client.clear_cache()
        logger.info("Cleared Wger cache")
        return {
            "status": "success",
            "message": "Cache cleared successfully"
        }
    except Exception as e:
        logger.error(f"Failed to clear cache: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear cache: {str(e)}") from e


@router.get("/exercise/{exercise_id}")
def get_exercise_detail(exercise_id: int) -> dict:
    """Get detailed information about a Wger exercise."""
    try:
        service = _get_service()
        exercise = service.repo.get_exercise(exercise_id)
        
        if not exercise:
            raise HTTPException(
                status_code=404,
                detail=f"Exercise {exercise_id} not found"
            )
        
        return {
            "wger_id": exercise.wger_id,
            "name": exercise.name,
            "description": exercise.description,
            "muscles_primary": exercise.muscles_primary,
            "muscles_secondary": exercise.muscles_secondary,
            "equipment": exercise.equipment,
            "category_id": exercise.category_id,
            "category_name": exercise.category_name,
            "images": exercise.images,
            "videos": exercise.videos,
            "synced_at": exercise.synced_at.isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get exercise detail: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get exercise: {str(e)}") from e


@router.get("/health")
def health_check() -> dict:
    """Health check for Wger integration."""
    try:
        # Quick test to see if API is accessible
        service = _get_service()
        status = service.get_sync_status()
        
        is_healthy = (
            status.get("total_exercises", 0) > 0 and
            not status.get("sync_in_progress", False)
        )
        
        return {
            "status": "healthy" if is_healthy else "degraded",
            "sync_status": status,
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
        }
