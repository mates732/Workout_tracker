from project_name.api.routes import ROUTES
from project_name.config.settings import Settings


def test_scaffold_contracts():
    assert "/api/workouts/generate" in ROUTES
    assert Settings().app_name
