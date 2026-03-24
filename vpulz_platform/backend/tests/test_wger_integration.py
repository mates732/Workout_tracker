"""Comprehensive tests for Wger integration."""

from __future__ import annotations

import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

from vpulz_platform.backend.database.wger_repository import WgerRepository
from vpulz_platform.backend.models.wger_models import (
    WgerExerciseData,
    WgerMuscle,
    WgerEquipment,
    WgerCategory,
    SyncStatus,
)
from vpulz_platform.backend.integrations.wger_client import WgerClient
from vpulz_platform.backend.integrations.wger_advanced_service import WgerAdvancedService


class TestWgerRepository:
    """Tests for WgerRepository."""

    def test_repository_initialization(self):
        """Test repository initializes with empty data."""
        repo = WgerRepository()
        assert len(repo.exercises) == 0
        assert len(repo.muscles) == 0
        assert len(repo.equipment) == 0
        assert len(repo.categories) == 0

    def test_save_and_get_exercise(self):
        """Test saving and retrieving exercises."""
        repo = WgerRepository()
        exercise = WgerExerciseData(
            wger_id=1,
            name="Bench Press",
            description="Horizontal press",
            muscles_primary=[1],
            equipment=[2],
            category_id=5,
        )

        repo.save_exercise(exercise)
        retrieved = repo.get_exercise(1)

        assert retrieved is not None
        assert retrieved.name == "Bench Press"
        assert retrieved.wger_id == 1

    def test_search_exercises(self):
        """Test searching exercises by name/description."""
        repo = WgerRepository()
        
        exercises = [
            WgerExerciseData(
                wger_id=1,
                name="Bench Press",
                description="Horizontal chest press",
                muscles_primary=[1],
            ),
            WgerExerciseData(
                wger_id=2,
                name="Incline Bench",
                description="Angled bench press",
                muscles_primary=[1],
            ),
            WgerExerciseData(
                wger_id=3,
                name="Squat",
                description="Lower body exercise",
                muscles_primary=[8],
            ),
        ]

        for ex in exercises:
            repo.save_exercise(ex)

        # Search for bench
        results = repo.search_exercises("bench")
        assert len(results) == 2
        assert all("bench" in ex.name.lower() for ex in results)

    def test_exercises_by_muscle(self):
        """Test retrieving exercises by muscle group."""
        repo = WgerRepository()

        exercises = [
            WgerExerciseData(wger_id=1, name="Press", muscles_primary=[1]),
            WgerExerciseData(wger_id=2, name="Fly", muscles_primary=[1]),
            WgerExerciseData(wger_id=3, name="Squat", muscles_primary=[8]),
        ]

        for ex in exercises:
            repo.save_exercise(ex)

        chest_exercises = repo.get_exercises_by_muscle(1)
        assert len(chest_exercises) == 2

        leg_exercises = repo.get_exercises_by_muscle(8)
        assert len(leg_exercises) == 1

    def test_save_muscle(self):
        """Test saving and retrieving muscles."""
        repo = WgerRepository()
        muscle = WgerMuscle(wger_id=1, name="Chest", name_en="Chest", is_front=True)

        repo.save_muscle(muscle)
        retrieved = repo.get_muscle(1)

        assert retrieved is not None
        assert retrieved.name == "Chest"

    def test_statistics(self):
        """Test repository statistics."""
        repo = WgerRepository()

        # Add some data
        exercise = WgerExerciseData(wger_id=1, name="Press", muscles_primary=[1])
        repo.save_exercise(exercise)
        repo.save_muscle(WgerMuscle(wger_id=1, name="Chest", name_en="Chest", is_front=True))

        stats = repo.get_statistics()
        assert stats["total_exercises"] == 1
        assert stats["total_muscles"] == 1


class TestWgerClient:
    """Tests for Wger API client."""

    @patch('vpulz_platform.backend.integrations.wger_client.requests')
    def test_client_initialization(self, mock_requests):
        """Test client initialization."""
        client = WgerClient(cache_ttl=1800)
        assert client.cache_ttl == 1800
        assert len(client._cache) == 0

    @patch('vpulz_platform.backend.integrations.wger_client.requests.get')
    def test_get_exercises_with_cache(self, mock_get):
        """Test that exercises are cached."""
        mock_response = Mock()
        mock_response.json.return_value = {
            "count": 2,
            "results": [
                {"id": 1, "name": "Exercise 1"},
                {"id": 2, "name": "Exercise 2"},
            ],
            "next": None,
        }
        mock_get.return_value = mock_response

        client = WgerClient()

        # First call
        result1 = client.get_exercises(limit=2)
        assert mock_get.call_count == 1

        # Second call (should be cached)
        result2 = client.get_exercises(limit=2)
        assert mock_get.call_count == 1  # No new call
        assert result1 == result2

    @patch('vpulz_platform.backend.integrations.wger_client.requests.get')
    def test_cache_invalidation(self, mock_get):
        """Test cache TTL expiration."""
        import time

        mock_response = Mock()
        mock_response.json.return_value = {"results": []}
        mock_get.return_value = mock_response

        client = WgerClient(cache_ttl=0.1)  # Very short TTL

        # First call
        client.get_exercises()
        assert mock_get.call_count == 1

        # Wait for cache to expire
        time.sleep(0.2)

        # Should make new call
        client.get_exercises()
        assert mock_get.call_count == 2

    def test_clear_cache(self):
        """Test cache clearing."""
        client = WgerClient()
        client._set_cached("test_key", {"data": "value"})
        assert len(client._cache) == 1

        client.clear_cache()
        assert len(client._cache) == 0


class TestWgerAdvancedService:
    """Tests for Wger Advanced Service."""

    @patch.object(WgerAdvancedService, '_sync_exercises')
    @patch.object(WgerAdvancedService, '_sync_muscles')
    @patch.object(WgerAdvancedService, '_sync_equipment')
    @patch.object(WgerAdvancedService, '_sync_categories')
    def test_full_sync(self, mock_categories, mock_equipment, mock_muscles, mock_exercises):
        """Test full sync operation."""
        mock_exercises.return_value = 5
        mock_muscles.return_value = None
        mock_equipment.return_value = None
        mock_categories.return_value = None

        repo = WgerRepository()
        client = Mock(spec=WgerClient)
        service = WgerAdvancedService(repo, client)

        result = service.sync_all_data()

        assert result["status"] == "success"
        assert result["exercises_synced"] == 5
        assert not repo.sync_status.sync_in_progress

    def test_search_advanced(self):
        """Test advanced search functionality."""
        repo = WgerRepository()
        client = Mock(spec=WgerClient)
        service = WgerAdvancedService(repo, client)

        # Add test data
        exercises = [
            WgerExerciseData(
                wger_id=1,
                name="Bench Press",
                description="Chest exercise",
                muscles_primary=[1],
                equipment=[2],
            ),
            WgerExerciseData(
                wger_id=2,
                name="Incline Press",
                description="Upper chest",
                muscles_primary=[1],
                equipment=[2],
            ),
        ]

        for ex in exercises:
            repo.save_exercise(ex)

        # Search by query
        results = service.search_advanced(query="bench", limit=10)
        assert results["count"] == 1
        assert results["results"][0]["name"] == "Bench Press"

        # Search by muscle
        results = service.search_advanced(muscle_ids=[1], limit=10)
        assert results["count"] == 2

    def test_get_recommendations(self):
        """Test exercise recommendations."""
        repo = WgerRepository()
        client = Mock(spec=WgerClient)
        service = WgerAdvancedService(repo, client)

        # Add test data
        muscle = WgerMuscle(wger_id=1, name="Chest", name_en="Chest", is_front=True)
        repo.save_muscle(muscle)

        exercises = [
            WgerExerciseData(wger_id=1, name="Press", muscles_primary=[1]),
            WgerExerciseData(wger_id=2, name="Fly", muscles_primary=[1]),
        ]

        for ex in exercises:
            repo.save_exercise(ex)

        result = service.get_exercise_recommendations(1, limit=10)
        assert result["muscle_id"] == 1
        assert result["muscle_name"] == "Chest"
        assert result["count"] == 2

    def test_muscles_with_exercise_counts(self):
        """Test getting muscles with exercise counts."""
        repo = WgerRepository()
        client = Mock(spec=WgerClient)
        service = WgerAdvancedService(repo, client)

        # Add test data
        muscles = [
            WgerMuscle(wger_id=1, name="Chest", name_en="Chest", is_front=True),
            WgerMuscle(wger_id=2, name="Back", name_en="Back", is_front=False),
        ]
        for m in muscles:
            repo.save_muscle(m)

        exercises = [
            WgerExerciseData(wger_id=1, name="Press", muscles_primary=[1]),
            WgerExerciseData(wger_id=2, name="Row", muscles_primary=[2]),
            WgerExerciseData(wger_id=3, name="Fly", muscles_primary=[1]),
        ]
        for ex in exercises:
            repo.save_exercise(ex)

        result = service.get_all_muscles_with_exercises()
        assert result["total_muscles"] == 2
        assert result["muscles"][0]["exercise_count"] in [1, 2]


class TestWgerIntegrationFlow:
    """Integration tests for complete Wger workflow."""

    @patch.object(WgerClient, '_request')
    def test_complete_sync_flow(self, mock_request):
        """Test complete sync workflow."""
        # Mock API responses
        mock_request.side_effect = [
            {"results": [{"id": 1, "name": "Chest", "is_front": True}]},  # muscles
            {"results": [{"id": 1, "name": "Barbell"}]},  # equipment
            {"results": [{"id": 1, "name": "Strength"}]},  # categories
            {
                "count": 1,
                "results": [
                    {
                        "id": 100,
                        "name": "Bench Press",
                        "description": "Best chest exercise",
                        "muscles": [1],
                        "muscles_secondary": [],
                        "equipment": [1],
                        "category": 1,
                    }
                ],
                "next": None,
            },
        ]

        repo = WgerRepository()
        client = WgerClient()
        service = WgerAdvancedService(repo, client)

        result = service.sync_all_data()

        assert result["status"] == "success"
        assert result["exercises_synced"] >= 0
        assert result["muscles_synced"] >= 0


# Pytest fixtures
@pytest.fixture
def wger_repo():
    """Fixture for Wger repository."""
    return WgerRepository()


@pytest.fixture
def mock_wger_client():
    """Fixture for mocked Wger client."""
    return Mock(spec=WgerClient)


@pytest.fixture
def wger_service(wger_repo, mock_wger_client):
    """Fixture for Wger service."""
    return WgerAdvancedService(wger_repo, mock_wger_client)
