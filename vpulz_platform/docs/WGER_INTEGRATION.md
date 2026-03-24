# Wger Integration System for Vpulz

## Overview

This comprehensive system integrates the **Wger** exercise library (30,000+ exercises) into your Vpulz platform. It provides a complete solution for managing, caching, searching, and syncing exercise data from the public Wger API.

## Architecture

### Components

1. **WgerClient** (`integrations/wger_client.py`)
   - Direct API client for Wger REST endpoints
   - Built-in caching (TTL: 1 hour by default)
   - Rate limiting (100ms between requests)
   - Comprehensive error handling with logging

2. **WgerRepository** (`database/wger_repository.py`)
   - In-memory data persistence layer
   - Indexed lookups for fast queries
   - Sync status tracking
   - Statistics and analytics

3. **WgerAdvancedService** (`integrations/wger_advanced_service.py`)
   - High-level business logic
   - Advanced search with multiple filters
   - Exercise recommendations
   - Statistics generation
   - Comprehensive sync operations

4. **Wger API Router** (`api/wger.py`)
   - FastAPI endpoints for client access
   - Background task support
   - Comprehensive error handling
   - Health checks and monitoring

5. **Celery Tasks** (`tasks/wger_tasks.py`)
   - Background sync operations
   - Scheduled sync tasks
   - Cache management
   - Distributed task support

## API Endpoints

### Synchronization

#### 1. Background Sync (Non-blocking)
```http
POST /wger/sync
```
Queues a full Wger data sync to run in the background. Returns immediately.

**Response:**
```json
{
  "status": "queued",
  "message": "Wger sync has been queued",
  "timestamp": "2026-03-24T10:30:00"
}
```

#### 2. Blocking Sync
```http
POST /wger/sync-blocking
```
Performs full sync immediately (may take 30+ seconds). Use for initial setup.

**Response:**
```json
{
  "status": "success",
  "exercises_synced": 35000,
  "muscles_synced": 15,
  "equipment_synced": 40,
  "categories_synced": 12,
  "duration_seconds": 45.2,
  "timestamp": "2026-03-24T10:30:00"
}
```

### Search

#### 3. Advanced Search
```http
GET /wger/search?query=bench&muscle_ids=1,3&limit=20
```

**Query Parameters:**
- `query` (optional): Text search in name/description
- `muscle_ids` (optional): Comma-separated muscle IDs
- `equipment_ids` (optional): Comma-separated equipment IDs
- `category_id` (optional): Exercise category ID
- `limit` (1-500): Maximum results

**Response:**
```json
{
  "results": [
    {
      "wger_id": 12345,
      "name": "Bench Press",
      "description": "Horizontal press for chest...",
      "muscles_primary": [1],
      "muscles_secondary": [3],
      "equipment": [2],
      "category_id": 5,
      "category_name": "Barbell",
      "synced_at": "2026-03-24T08:00:00"
    }
  ],
  "count": 1,
  "filters": {
    "query": "bench",
    "muscle_ids": [1, 3],
    "equipment_ids": null,
    "category_id": null
  }
}
```

### Recommendations

#### 4. Get Exercise Recommendations
```http
GET /wger/recommended/{muscle_id}?limit=10
```

Get all exercises targeting a specific muscle.

**Response:**
```json
{
  "muscle_id": 1,
  "muscle_name": "Chest",
  "exercises": [...],
  "count": 42
}
```

### Reference Data

#### 5. Get All Muscles
```http
GET /wger/muscles
```

**Response:**
```json
{
  "muscles": [
    {
      "muscle_id": 1,
      "muscle_name": "Chest",
      "exercise_count": 127
    },
    {
      "muscle_id": 2,
      "muscle_name": "Back",
      "exercise_count": 154
    }
  ],
  "total_muscles": 15
}
```

#### 6. Get All Equipment
```http
GET /wger/equipment
```

**Response:**
```json
{
  "equipment": [
    {
      "equipment_id": 1,
      "equipment_name": "Barbell",
      "exercise_count": 523
    }
  ],
  "total_equipment": 40
}
```

### Status & Monitoring

#### 7. Get Sync Status
```http
GET /wger/status
```

**Response:**
```json
{
  "last_sync": "2026-03-24T10:30:00",
  "total_exercises": 35000,
  "total_muscles": 15,
  "total_equipment": 40,
  "total_categories": 12,
  "sync_in_progress": false,
  "last_error": null,
  "last_sync_duration_seconds": 45.2
}
```

#### 8. Get Statistics
```http
GET /wger/statistics
```

**Response:**
```json
{
  "library_statistics": {
    "total_exercises": 35000,
    "total_muscles": 15,
    "total_equipment": 40,
    "total_categories": 12,
    "last_sync": "2026-03-24T10:30:00",
    "sync_in_progress": false,
    "last_error": null
  },
  "cache": {
    "cached_entries": 12,
    "cache_ttl_seconds": 3600
  },
  "last_updated": "2026-03-24T10:30:00"
}
```

#### 9. Health Check
```http
GET /wger/health
```

**Response:**
```json
{
  "status": "healthy",
  "sync_status": {...}
}
```

### Cache Management

#### 10. Clear Cache
```http
POST /wger/cache/clear
```

**Response:**
```json
{
  "status": "success",
  "message": "Cache cleared successfully"
}
```

### Exercise Details

#### 11. Get Exercise Detail
```http
GET /wger/exercise/{exercise_id}
```

**Response:**
```json
{
  "wger_id": 12345,
  "name": "Bench Press",
  "description": "...",
  "muscles_primary": [1],
  "muscles_secondary": [3],
  "equipment": [2],
  "category_id": 5,
  "category_name": "Barbell",
  "images": ["url1", "url2"],
  "videos": ["url3"],
  "synced_at": "2026-03-24T08:00:00"
}
```

## Data Models

### WgerExerciseData
```python
@dataclass
class WgerExerciseData:
    wger_id: int
    name: str
    description: str
    images: list[str]
    videos: list[str]
    muscles_primary: list[int]
    muscles_secondary: list[int]
    equipment: list[int]
    category_id: int | None
    category_name: str
    created_at: datetime
    synced_at: datetime
    raw_data: dict[str, Any]
```

### WgerMuscle
```python
@dataclass
class WgerMuscle:
    wger_id: int
    name: str
    name_en: str
    is_front: bool
    synced_at: datetime
```

### WgerEquipment
```python
@dataclass
class WgerEquipment:
    wger_id: int
    name: str
    synced_at: datetime
```

## Usage Examples

### Python Backend

```python
from vpulz_platform.backend.core.container import container
from vpulz_platform.backend.integrations.wger_advanced_service import WgerAdvancedService

# Get service instance
service = WgerAdvancedService(
    container.wger_repo,
    container.wger_client
)

# Sync all data
result = service.sync_all_data()
print(f"Synced {result['exercises_synced']} exercises")

# Search for exercises
results = service.search_advanced(
    query="squat",
    muscle_ids=[8, 9, 10],  # quads, hamstrings, glutes
    limit=20
)

# Get recommendations
recommendations = service.get_exercise_recommendations(
    primary_muscle=1,  # chest
    limit=10
)

# Get status
status = service.get_sync_status()
```

### API Client (JavaScript/Fetch)

```javascript
// Background sync
const syncResponse = await fetch('/api/wger/sync', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
});

// Advanced search
const searchResponse = await fetch(
  '/api/wger/search?query=bench&muscle_ids=1,3&limit=20',
  { headers: { 'Authorization': 'Bearer YOUR_API_KEY' } }
);
const exercises = await searchResponse.json();

// Get recommendations
const recResponse = await fetch(
  '/api/wger/recommended/1?limit=10',
  { headers: { 'Authorization': 'Bearer YOUR_API_KEY' } }
);
const recommendations = await recResponse.json();

// Get status
const statusResponse = await fetch(
  '/api/wger/status',
  { headers: { 'Authorization': 'Bearer YOUR_API_KEY' } }
);
const status = await statusResponse.json();
```

## Configuration

### Environment Variables

```env
# Optional: Custom Wger API base URL
WGER_BASE_URL=https://wger.de/api/v2

# Cache TTL in seconds
WGER_CACHE_TTL=3600
```

### Container Configuration

```python
# In vpulz_platform/backend/core/container.py
wger_client: WgerClient = field(
    default_factory=lambda: WgerClient(cache_ttl=3600)
)
wger_repo: WgerRepository = field(default_factory=WgerRepository)
```

## Performance Considerations

1. **Cache**: All API responses are cached for 1 hour by default
2. **Rate Limiting**: 100ms delay between consecutive requests to respect API limits
3. **Background Sync**: Use non-blocking sync endpoint for large operations
4. **Indexing**: Repository maintains multiple indexes for fast lookups
5. **Pagination**: Automatic pagination handling in sync operations

## Error Handling

All endpoints include comprehensive error handling:

```json
{
  "detail": "Description of the error"
}
```

HTTP Status Codes:
- `200`: Success
- `404`: Resource not found
- `409`: Conflict (e.g., sync already in progress)
- `500`: Internal server error

## Logging

The system uses Python's standard `logging` module:

```python
import logging

logger = logging.getLogger(__name__)
# Logs include sync progress, cache hits, and errors
```

Configure logging level:
```python
import logging
logging.getLogger('vpulz_platform.backend.integrations').setLevel(logging.DEBUG)
```

## Testing

```python
# Unit test example
def test_wger_search():
    from vpulz_platform.backend.database.wger_repository import WgerRepository
    from vpulz_platform.backend.integrations.wger_advanced_service import WgerAdvancedService
    from vpulz_platform.backend.integrations.wger_client import WgerClient
    
    repo = WgerRepository()
    client = WgerClient()
    service = WgerAdvancedService(repo, client)
    
    # Run sync and test search
    service.sync_all_data()
    results = service.search_advanced(query="bench", limit=5)
    
    assert results["count"] > 0
    assert len(results["results"]) <= 5
```

## Troubleshooting

### Sync Fails
1. Check network connectivity
2. Verify Wger API is accessible: https://wger.de/api/v2/exercise/
3. Check logs for detailed error messages
4. Clear cache and retry

### Slow Searches
1. Use more specific filters (muscle_ids, equipment_ids)
2. Reduce limit parameter
3. Check cache status at `/wger/statistics`

### High Memory Usage
1. Clear cache: `POST /wger/cache/clear`
2. Monitor cached_entries count
3. Reduce in-memory dataset if needed

## Future Enhancements

1. Database persistence (PostgreSQL)
2. Redis caching layer
3. Incremental sync (only changed exercises)
4. Image caching and CDN integration
5. Exercise versioning and history
6. User-contributed exercises
7. Multi-language support
8. Advanced filtering by equipment combinations
9. Exercise similarity/alternatives
10. Progress photo integration
