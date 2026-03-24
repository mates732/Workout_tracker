# Wger Integration Setup Guide

## Quick Setup

### 1. Installation

The Wger integration is already set up in your Vpulz platform. Just ensure dependencies are installed:

```bash
cd vpulz_platform/backend
pip install -r requirements.txt
```

The `requests` library is already added to requirements.txt.

### 2. Initialize the Service Container

The service container ([core/container.py](core/container.py)) automatically initializes Wger components:

```python
from vpulz_platform.backend.core.container import container

# Wger components are already available
print(container.wger_repo)      # WgerRepository instance
print(container.wger_client)    # WgerClient instance
```

### 3. First Sync

Perform the initial full sync to populate the exercise library:

```bash
# Using curl
curl -X POST http://localhost:8000/wger/sync \
  -H "Authorization: Bearer YOUR_API_KEY"

# Or blocking sync (if you want to wait)
curl -X POST http://localhost:8000/wger/sync-blocking \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Common Tasks

### Search for Exercises

```python
from vpulz_platform.backend.core.container import container
from vpulz_platform.backend.integrations.wger_advanced_service import WgerAdvancedService

service = WgerAdvancedService(container.wger_repo, container.wger_client)

# Simple text search
results = service.search_advanced(query="bench press", limit=10)

# Search by muscle groups (chest, shoulders, triceps)
results = service.search_advanced(muscle_ids=[1, 3, 5], limit=20)

# Search by equipment (barbell, dumbbell)
results = service.search_advanced(equipment_ids=[1, 2], limit=15)

# Combined filter
results = service.search_advanced(
    query="press",
    muscle_ids=[1, 3],      # chest, shoulders
    equipment_ids=[1],       # barbell
    limit=25
)

for exercise in results["results"]:
    print(f"{exercise['name']} - {exercise['category_name']}")
```

### Get Exercises for a Specific Muscle

```python
service = WgerAdvancedService(container.wger_repo, container.wger_client)

# Get all benching exercises for chest (muscle_id=1)
chest_exercises = service.get_exercise_recommendations(
    primary_muscle=1,
    limit=30
)

print(f"Muscle: {chest_exercises['muscle_name']}")
print(f"Exercise count: {chest_exercises['count']}")
for ex in chest_exercises["exercises"]:
    print(f"  - {ex['name']}")
```

### Monitor Sync Progress

```python
service = WgerAdvancedService(container.wger_repo, container.wger_client)

status = service.get_sync_status()
print(f"Total exercises: {status['total_exercises']}")
print(f"Sync in progress: {status['sync_in_progress']}")
print(f"Last sync: {status['last_sync']}")
print(f"Last error: {status['last_error']}")
```

### View Library Statistics

```python
# Using the repo
stats = container.wger_repo.get_statistics()
print(f"Exercises: {stats['total_exercises']}")
print(f"Muscles: {stats['total_muscles']}")
print(f"Equipment: {stats['total_equipment']}")
print(f"Categories: {stats['total_categories']}")

# Check cache status
cache_size = len(container.wger_client._cache)
print(f"Cached entries: {cache_size}")
```

## API Usage Examples

### Using httpx or requests in your app

```python
import httpx

# Search for exercises
async def search_exercises(query: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "http://localhost:8000/wger/search",
            params={"query": query, "limit": 20},
            headers={"Authorization": "Bearer TOKEN"}
        )
        return response.json()

# Get muscle groups
async def get_muscle_groups():
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "http://localhost:8000/wger/muscles",
            headers={"Authorization": "Bearer TOKEN"}
        )
        return response.json()

# Get recommendations
async def get_recommendations(muscle_id: int):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"http://localhost:8000/wger/recommended/{muscle_id}?limit=15",
            headers={"Authorization": "Bearer TOKEN"}
        )
        return response.json()
```

## Celery Integration (Background Tasks)

### Setup Celery

```python
# In your celery configuration
from vpulz_platform.backend.tasks.wger_tasks import sync_wger_data

# Queue immediate sync
sync_wger_data.delay()

# Schedule periodic sync (every 24 hours)
from celery.schedules import crontab

app.conf.beat_schedule = {
    'sync-wger-data': {
        'task': 'vpulz_platform.backend.tasks.wger_tasks.sync_wger_data',
        'schedule': crontab(hour=2, minute=0),  # 2 AM daily
    },
}
```

### Monitor Task Progress

```python
from vpulz_platform.backend.tasks.wger_tasks import sync_wger_data

# Queue sync and get task ID
task = sync_wger_data.delay()

# Check task status
print(f"Task ID: {task.id}")
print(f"Status: {task.status}")
print(f"Result: {task.result}")
```

## Configuration Options

### WgerClient Options

```python
from vpulz_platform.backend.integrations.wger_client import WgerClient

# Custom configuration
client = WgerClient(
    base_url="https://wger.de/api/v2",  # Default
    cache_ttl=3600  # Cache for 1 hour
)

# Set custom timeouts
client.REQUEST_TIMEOUT = 20  # seconds
client.RATE_LIMIT_DELAY = 0.15  # seconds between requests
```

### Integrated with Container

```python
# In container.py, customize as needed
wger_client: WgerClient = field(
    default_factory=lambda: WgerClient(cache_ttl=7200)  # 2 hours
)
```

## Performance Tips

### 1. Use Caching

```python
# Cache is automatic, but you can adjust TTL
from vpulz_platform.backend.core.container import container

# Cache TTL is 3600 seconds (1 hour) by default
# Change if needed:
container.wger_client.cache_ttl = 7200  # 2 hours
```

### 2. Use Specific Filters

```python
# ❌ Slow - searches all exercises
results = service.search_advanced(query="press")

# ✅ Fast - narrows down search space first
results = service.search_advanced(
    query="press",
    muscle_ids=[1, 3],  # chest, shoulders
    limit=20
)
```

### 3. Background Sync for Large Operations

```python
# ✅ Good - doesn't block API
background_tasks.add_task(service.sync_all_data)

# ❌ Avoid - blocks user request
service.sync_all_data()  # Takes 30+ seconds
```

### 4. Monitor Cache

```python
# Clear cache when data gets stale
if container.wger_repo.sync_status.sync_in_progress:
    container.wger_client.clear_cache()
```

## Troubleshooting

### Issue: "Sync already in progress"

**Solution**: Wait for current sync to complete or restart the service.

```python
# Check status
status = service.get_sync_status()
if status["sync_in_progress"]:
    print("Please wait for sync to complete")
```

### Issue: No exercises found after sync

**Solution**: Verify sync completed successfully.

```python
status = service.get_sync_status()
if status["last_error"]:
    print(f"Sync failed: {status['last_error']}")
else:
    print(f"Exercises: {status['total_exercises']}")
```

### Issue: Search returns no results

**Solution**: Check available muscles and equipment.

```python
# List all muscles
muscles = service.get_all_muscles_with_exercises()
for muscle in muscles["muscles"]:
    if muscle["exercise_count"] > 0:
        print(f"{muscle['muscle_name']}: {muscle['exercise_count']} exercises")

# Find valid muscle ID
for m in muscles["muscles"]:
    if "chest" in m["muscle_name"].lower():
        print(f"Chest ID: {m['muscle_id']}")
```

### Issue: High memory usage

**Solution**: Clear cache or reduce dataset.

```python
# Clear cache
container.wger_client.clear_cache()

# Check cache size
cache_info = container.wger_repo.get_statistics()
print(f"Cache entries: {len(container.wger_client._cache)}")
```

## Testing

Run the test suite:

```bash
# All Wger tests
pytest vpulz_platform/backend/tests/test_wger_integration.py -v

# Specific test class
pytest vpulz_platform/backend/tests/test_wger_integration.py::TestWgerRepository -v

# With coverage
pytest vpulz_platform/backend/tests/test_wger_integration.py --cov=vpulz_platform.backend.integrations
```

## Monitoring and Logging

### Enable Debug Logging

```python
import logging

# Enable debug logging for Wger components
logging.getLogger('vpulz_platform.backend.integrations').setLevel(logging.DEBUG)
logging.getLogger('vpulz_platform.backend.database.wger_repository').setLevel(logging.DEBUG)

# Now all operations are logged
```

### Health Check

```bash
# Check Wger integration health
curl http://localhost:8000/wger/health \
  -H "Authorization: Bearer TOKEN"
```

## Next Steps

1. **Deploy**: Push changes to production
2. **Monitor**: Set up logging and alerts for sync failures
3. **Optimize**: Adjust cache TTL and rate limits based on usage
4. **Extend**: Integrate with UI to display Wger exercises
5. **Backup**: Consider periodic data backups if using persistent storage

## API Reference

See [WGER_INTEGRATION.md](WGER_INTEGRATION.md) for complete API documentation.
