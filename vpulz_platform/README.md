# VPULZ Platform

Next-generation AI-powered strength training backend scaffold.

See `docs/system_design.md` for architecture, feature design, schema, API, AI agents, prediction model, UX structure, implementation, and deployment.

## Exercise Platform Module

Production-focused exercise database support is added in:

- `database/migrations/0002_exercise_platform.sql`
- `backend/api/exercises.py`
- `backend/services/exercise_service.py`
- `backend/database/exercise_repository.py`

### New API Endpoints

- `POST /exercises/search`
- `POST /exercises/custom`
- `POST /exercises/duplicate-check`
- `POST /exercises/{exercise_id}/favorite`
- `POST /exercises/{exercise_id}/recent`
- `GET /profile/{user_id}`
- `PUT /profile/{user_id}`
- `GET /workouts/active/{user_id}`
- `GET /workouts/history/{user_id}`

### Motia Integration

Set these environment variables to connect AI auto-classification and similarity scoring to Motia:

- `MOTIA_BASE_URL`
- `MOTIA_API_KEY`

If not set, the backend uses deterministic local fallback classification so the API still works.

### AI Trainer Context

The assistant endpoint now reads and returns context built from:

- stored user profile and constraints
- equipment access
- injuries and limitations
- workout history
- active workout state
- routines
- fatigue, strength score, estimated 1RM, consistency, and training DNA

### Validate

Install dependencies and run:

- `py -m pip install -r vpulz_platform/backend/requirements.txt`
- `py -m pip install pytest`
- `py -m pytest vpulz_platform/backend/tests/test_exercise_service.py vpulz_platform/backend/tests/test_core_flows.py`
