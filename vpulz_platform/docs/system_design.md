# 1. System Architecture

VPULZ architecture uses clean service boundaries:

- API Layer (`backend/api`): HTTP endpoints and request validation.
- Service Layer (`backend/services`): workout logic, recommendations, analytics, predictions.
- Repository Layer (`backend/database/repositories.py`): persistence abstraction.
- AI Layer (`backend/ai` + `backend/agents`): context builder, rule engine, model router, model clients.
- Security (`backend/utils/security.py`): API key guard.

Request path:

Client -> FastAPI Endpoint -> Service -> Repository + AI Orchestrator -> Response

# 2. Product Feature Design

- Ultra-fast logging: `start_workout`, `add_exercise`, `log_set`, `edit_set`, `finish_workout`
- Routines: manual + goal-generated routines with split templates
- Progress analytics: 1RM, volume, frequency, consistency
- AI coach: asks-aware responses using rules + model routing
- Predictions: 4/8/12 week strength forecast
- Fatigue and strength score: computed from recent sessions

# 3. Database Schema

See `database/schema.sql` for Users, Exercises, Workouts, WorkoutExercises, Sets, Routines,
RoutineExercises, PersonalRecords (represented through metrics+insights extensions),
ProgressMetrics, AIInsights (represented as `knowledge_chunks` + insight pipeline).

# 4. API Endpoints

- `POST /workouts/start`
- `POST /workouts/{workout_id}/exercise`
- `POST /workouts/{workout_id}/set`
- `PATCH /workouts/{workout_id}/set`
- `POST /workouts/{workout_id}/finish`
- `POST /routines`
- `POST /routines/{routine_id}/exercise`
- `POST /routines/generate`
- `POST /assistant/ask`
- `GET /analytics/progress/{user_id}`
- `GET /analytics/strength-score/{user_id}`

# 5. AI Agent Design

AI orchestrator flow:
1. Build context from profile/history/routine/fatigue.
2. Try rule engine first (cost-optimized deterministic answers).
3. Route query to fast model or reasoning model.
4. Return answer with safe fallback text.

# 6. Prediction Model Design

- Strength forecast based on latest estimated 1RM and linear progression coefficients.
- Fatigue model based on rolling volume + high-RPE + decline proxy.
- Strength score combines 1RM, volume, and consistency into one index.

# 7. UX Design Structure

- Dashboard: today suggestion, fatigue, strength score, PR highlights.
- Workout Screen: fast set logging actions and edit path.
- Progress Screen: volume trend, consistency, predictions.
- Coach Chat: simple question-to-advice interface.

# 8. Backend Implementation

Implemented under `vpulz_platform/backend` as modular Python packages with FastAPI entrypoint at `main.py`.

# 9. Deployment Guide

Run locally:

```bash
pip install -r vpulz_platform/backend/requirements.txt
PYTHONPATH=. uvicorn vpulz_platform.backend.main:app --host 0.0.0.0 --port 8100
```

Security:
- Send `X-API-Key` header matching `VPULZ_API_KEY`.
- Configure secrets via environment variables.
