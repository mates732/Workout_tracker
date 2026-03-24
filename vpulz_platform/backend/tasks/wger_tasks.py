"""Celery tasks for Wger integration and background operations."""

from __future__ import annotations

import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def sync_wger_data(self):
    """Background task to sync all Wger data.
    
    Retries up to 3 times with 5-minute delays on failure.
    """
    try:
        from vpulz_platform.backend.core.container import container
        from vpulz_platform.backend.integrations.wger_advanced_service import WgerAdvancedService
        
        logger.info("Starting Wger data sync task")
        
        service = WgerAdvancedService(
            container.wger_repo,
            container.wger_client
        )
        result = service.sync_all_data()
        
        logger.info(f"Wger sync completed: {result}")
        return result
        
    except Exception as exc:
        logger.error(f"Wger sync task failed: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=2)
def sync_wger_exercises_filtered(self, muscle_ids=None, equipment_ids=None):
    """Background task to sync filtered exercises.
    
    Args:
        muscle_ids: List of muscle IDs to filter by
        equipment_ids: List of equipment IDs to filter by
    """
    try:
        from vpulz_platform.backend.core.container import container
        from vpulz_platform.backend.integrations.wger_advanced_service import WgerAdvancedService
        
        logger.info(f"Starting filtered Wger sync: muscles={muscle_ids}, equipment={equipment_ids}")
        
        service = WgerAdvancedService(
            container.wger_repo,
            container.wger_client
        )
        result = service.search_advanced(
            muscle_ids=muscle_ids,
            equipment_ids=equipment_ids,
            limit=1000
        )
        
        logger.info(f"Filtered sync completed: {len(result.get('results', []))} exercises")
        return result
        
    except Exception as exc:
        logger.error(f"Filtered sync task failed: {exc}")
        raise self.retry(exc=exc)


@shared_task
def clear_wger_cache():
    """Background task to clear Wger client cache."""
    try:
        from vpulz_platform.backend.core.container import container
        
        container.wger_client.clear_cache()
        logger.info("Cleared Wger client cache")
        return {"status": "success", "message": "Cache cleared"}
        
    except Exception as e:
        logger.error(f"Failed to clear cache: {e}")
        return {"status": "error", "message": str(e)}


@shared_task
def scheduled_wger_sync():
    """Scheduled task to perform daily Wger sync."""
    logger.info("Running scheduled Wger sync")
    return sync_wger_data.delay()
