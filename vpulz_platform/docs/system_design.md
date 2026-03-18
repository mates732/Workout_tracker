# 1) System Architecture

VPULZ uses a modular FastAPI backend and React Native mobile app.

- `backend/api`: route handlers for workouts, routines, analytics, and assistant chat.
- `backend/services`: domain logic for fast logging, analytics, prediction, and recommendations.
- `backend/ai`: context builder, rule engine, model router, and model clients.
- `backend/core/container.py`: shared service container to keep a consistent in-memory state.
- `backend/database`: repository interfaces + SQL schema for PostgreSQL + pgvector.

Flow: `Client -> API -> Services -> Repositories/AI -> Response`.

# 2) Product Feature Design

Core fast logging actions:
- `start_workout()`
- `add_exercise()`
- `log_set()`
- `edit_set()`
- `finish_workout()`

Each set stores: `weight`, `reps`, `RPE`, `notes`, `timestamp`.

Additional product modules:
- routine generation for PPL / upper-lower / full body
- progressive overload recommendation
- smart warmup generation
- real-time workout companion feedback
- strength score, fatigue score, and progress snapshots
- predictive 4/8/12-week 1RM forecasts and training DNA profile

# 3) Database Schema

PostgreSQL schema in `vpulz_platform/database/schema.sql` includes:
- `users`
- `exercises`
- `workouts`
- `workout_exercises`
- `sets`
- `routines`
- `routine_exercises`
- `personal_records`
- `progress_metrics`
- `ai_insights`
- `knowledge_chunks` (`vector(768)` for pgvector embeddings)

# 4) API Endpoints

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
- `GET /analytics/warmup?target_weight=120`

# 5) AI Architecture

AI pipeline:
1. user query enters assistant endpoint
2. context builder summarizes profile + history + routine + fatigue
3. rule engine handles deterministic low-cost queries first
4. model router sends simple prompts to fast model (Groq/Llama), complex prompts to reasoning model (Gemini)

This reduces AI cost while preserving quality for complex analysis.

# 6) Prediction Model Design

- Estimated 1RM uses Epley: `weight * (1 + reps/30)`.
- Forecast model applies bounded short-cycle progression factors for week 4/8/12.
- Training DNA classifies user adaptation (moderate-volume, high-intensity, or balanced).

# 7) Mobile App Structure

```text
mobile/react-native-app/
  screens/
    HomeScreen.tsx
    WorkoutScreen.tsx
    ProgressScreen.tsx
    CoachScreen.tsx
    ProfileScreen.tsx
  components/
    SetLogger.tsx
    ExerciseChip.tsx
    StrengthScoreCard.tsx
  hooks/
    useWorkoutSession.ts
    useRealtimeSync.ts
  services/
    apiClient.ts
    offlineQueue.ts
```

# 8) Backend Implementation

Implemented as Python modules under `vpulz_platform/backend`:
- stateful service composition in `core/container.py`
- robust workout/routine APIs with error handling
- analytics endpoint with predictions + DNA + timeline
- smart warmup endpoint
- real-time companion feedback when a set is logged

# 9) Deployment Infrastructure

- Dockerized deployment for backend and database
- CI pipeline for lint/test/build before release
- environment-driven secret management (`VPULZ_API_KEY`, provider keys)
- scalable target: AWS ECS/Fargate or GCP Cloud Run + managed Postgres
