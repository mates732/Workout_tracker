from __future__ import annotations

import logging
import time
from typing import Any

logger = logging.getLogger(__name__)


class WgerClient:
    """Enhanced client for integrating with Wger exercise library API."""

    BASE_URL = "https://wger.de/api/v2"
    REQUEST_TIMEOUT = 15
    RATE_LIMIT_DELAY = 0.1  # seconds between requests

    def __init__(self, base_url: str | None = None, cache_ttl: int = 3600):
        """Initialize Wger client with optional custom base URL and caching.
        
        Args:
            base_url: Optional custom Wger API base URL
            cache_ttl: Cache time-to-live in seconds (default 1 hour)
        """
        try:
            import requests
        except ImportError:
            raise ImportError("requests library is required. Install with: pip install requests")
        
        self.requests = requests
        self.base_url = base_url or self.BASE_URL
        self.cache_ttl = cache_ttl
        self._cache: dict[str, tuple[Any, float]] = {}
        self._last_request_time = 0.0
        logger.info(f"Initialized Wger client with base URL: {self.base_url}")

    def _rate_limit(self) -> None:
        """Apply rate limiting between requests."""
        elapsed = time.time() - self._last_request_time
        if elapsed < self.RATE_LIMIT_DELAY:
            time.sleep(self.RATE_LIMIT_DELAY - elapsed)
        self._last_request_time = time.time()

    def _get_cached(self, key: str) -> Any | None:
        """Get cached value if still valid."""
        if key in self._cache:
            data, timestamp = self._cache[key]
            if time.time() - timestamp < self.cache_ttl:
                logger.debug(f"Cache HIT for {key}")
                return data
            else:
                del self._cache[key]
        return None

    def _set_cached(self, key: str, data: Any) -> None:
        """Set cached value with timestamp."""
        self._cache[key] = (data, time.time())
        logger.debug(f"Cache SET for {key}")

    def _request(self, endpoint: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        """Make authenticated request to Wger API with error handling.
        
        Args:
            endpoint: API endpoint (without base URL)
            params: Optional query parameters
            
        Returns:
            JSON response as dictionary
            
        Raises:
            ConnectionError: If request fails
            ValueError: If response is invalid
        """
        self._rate_limit()
        url = f"{self.base_url}{endpoint}"
        
        try:
            logger.debug(f"Requesting {url} with params {params}")
            response = self.requests.get(
                url,
                params=params or {},
                timeout=self.REQUEST_TIMEOUT,
                headers={"User-Agent": "vpulz-wger-client/1.0"}
            )
            response.raise_for_status()
            return response.json()
        except self.requests.Timeout as e:
            logger.error(f"Timeout requesting {endpoint}: {e}")
            raise ConnectionError(f"Request timeout for {endpoint}: {e}") from e
        except self.requests.ConnectionError as e:
            logger.error(f"Connection error requesting {endpoint}: {e}")
            raise ConnectionError(f"Connection failed for {endpoint}: {e}") from e
        except self.requests.HTTPError as e:
            logger.error(f"HTTP error requesting {endpoint}: {e.response.status_code}")
            raise ConnectionError(f"HTTP {e.response.status_code} for {endpoint}") from e
        except ValueError as e:
            logger.error(f"Invalid JSON response from {endpoint}: {e}")
            raise ValueError(f"Invalid JSON response from {endpoint}") from e

    def get_exercises(self, limit: int = 100, offset: int = 0) -> dict[str, Any]:
        """Fetch exercises from Wger API with pagination and caching."""
        cache_key = f"exercises_limit{limit}_offset{offset}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached

        data = self._request("/exercise/", params={"limit": limit, "offset": offset})
        self._set_cached(cache_key, data)
        return data

    def get_exercise_detail(self, exercise_id: int) -> dict[str, Any]:
        """Fetch detailed information about a specific exercise with caching."""
        cache_key = f"exercise_{exercise_id}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached

        data = self._request(f"/exercise/{exercise_id}/")
        self._set_cached(cache_key, data)
        return data

    def get_equipment(self) -> dict[str, Any]:
        """Fetch available equipment types with caching."""
        cache_key = "equipment"
        cached = self._get_cached(cache_key)
        if cached:
            return cached

        data = self._request("/equipment/")
        self._set_cached(cache_key, data)
        return data

    def get_muscles(self) -> dict[str, Any]:
        """Fetch available muscle groups with caching."""
        cache_key = "muscles"
        cached = self._get_cached(cache_key)
        if cached:
            return cached

        data = self._request("/muscle/")
        self._set_cached(cache_key, data)
        return data

    def get_exercise_categories(self) -> dict[str, Any]:
        """Fetch exercise categories with caching."""
        cache_key = "categories"
        cached = self._get_cached(cache_key)
        if cached:
            return cached

        data = self._request("/exercisecategory/")
        self._set_cached(cache_key, data)
        return data

    def get_exercise_images(self, exercise_id: int) -> dict[str, Any]:
        """Fetch images for a specific exercise."""
        cache_key = f"exercise_images_{exercise_id}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached

        data = self._request("/exerciseimage/", params={"exercise": exercise_id})
        self._set_cached(cache_key, data)
        return data

    def get_exercise_videos(self, exercise_id: int) -> dict[str, Any]:
        """Fetch videos for a specific exercise."""
        cache_key = f"exercise_videos_{exercise_id}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached

        data = self._request("/video/", params={"exercise": exercise_id})
        self._set_cached(cache_key, data)
        return data

    def fetch_all_exercises(self, progress_callback=None) -> list[dict[str, Any]]:
        """Fetch all exercises with pagination handling and progress tracking.
        
        Args:
            progress_callback: Optional callable(current, total) for progress reporting
            
        Returns:
            List of all exercises
        """
        all_exercises = []
        offset = 0
        limit = 100
        logger.info("Starting full exercise sync")

        try:
            while True:
                data = self.get_exercises(limit=limit, offset=offset)
                results = data.get("results", [])
                if not results:
                    logger.info(f"No more exercises at offset {offset}")
                    break

                all_exercises.extend(results)
                logger.info(f"Fetched {len(results)} exercises (total: {len(all_exercises)})")

                if progress_callback:
                    total = data.get("count", len(all_exercises))
                    progress_callback(len(all_exercises), total)

                next_url = data.get("next")
                if not next_url:
                    break

                offset += limit

            logger.info(f"Completed fetching {len(all_exercises)} exercises")
            return all_exercises
        except Exception as e:
            logger.error(f"Error during exercise fetch: {e}")
            raise

    def clear_cache(self) -> None:
        """Clear all cached data."""
        self._cache.clear()
        logger.info("Cleared Wger client cache")
