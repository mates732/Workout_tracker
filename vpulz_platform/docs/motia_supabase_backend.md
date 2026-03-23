# VPULZ Motia + Supabase Backend Architecture

## Core Stack

- Supabase: Auth + Postgres tables in `app_core` schema
- Motia workflows: orchestrated in `backend/workflows/motia_workflows.py`
- Offline-first sync: local queue on mobile + `/sync` reconciliation endpoint

## Database Schema

Migration: `database/migrations/0003_motia_supabase_backend.sql`

Tables:

1. `app_core.users`
   - `id`, `email`, `created_at`
2. `app_core.workouts`
   - `id`, `user_id`, `date`, `duration`, `notes`
3. `app_core.exercises`
   - `id`, `name`, `muscle_group`, `equipment`
4. `app_core.workout_exercises`
   - `id`, `workout_id`, `exercise_id`, `order_index`
5. `app_core.sets`
   - `id`, `workout_exercise_id`, `weight`, `reps`, `type`, `completed`
6. `app_core.training_plans`
   - `id`, `user_id`, `type`
7. `app_core.calendar_entries`
   - `id`, `user_id`, `date`, `status`

Scalability controls:

- Unique constraints for plan-per-user, workout exercise order, per-day calendar entry
- Status/type CHECK constraints to enforce clean state machine
- Query indexes on user/date and relationship keys

## Workflow Definitions (Motia)

Implemented in `backend/workflows/motia_workflows.py`:

1. `startWorkout`
   - Ensures user record exists
   - Prevents duplicate active sessions by reusing existing active workout
   - Creates a new workout and sets day as planned
2. `addExerciseToWorkout`
   - Finds/creates exercise catalog record
   - Attaches exercise with stable `order_index`
   - Creates default set
3. `completeSet`
   - Writes set metrics and marks completed
   - Returns analytics-trigger flag for downstream jobs
4. `finishWorkout`
   - Calculates duration from start time
   - Marks workout complete
   - Updates calendar day to `completed`
5. `syncTrainingPlan`
   - Upserts user plan type
   - Generates two-week schedule and fills `calendar_entries` with `planned`
6. `markSickDay`
   - Marks calendar day status as `sick`
7. `syncWithSupabase`
   - Pushes local payload to Supabase
   - Pulls latest workouts/calendar for client reconciliation

## API Endpoints

Router: `backend/api/motia_backend.py`

- `POST /workout/start`
- `POST /workout/add-exercise`
- `POST /set/complete`
- `POST /workout/finish`
- `GET /calendar`
- `POST /calendar/sick`

Additional operational endpoints:

- `POST /training-plan/sync`
- `POST /sync`
- `POST /ai/coach`

Security:

- Existing `x-api-key` requirement (global)
- Supabase bearer token verification via `backend/auth/supabase_auth.py`

## AI Integration Layer

Service: `backend/services/ai_service.py`

- `groq_provider`
- `gemini_provider`
- `fallback`
- Exposed through `POST /ai/coach`

Provider order is configurable via `AI_PROVIDER_ORDER`.

## Frontend Integration Notes

Map mobile actions to backend endpoints:

- Workout button -> `POST /workout/start`
- Add exercise -> `POST /workout/add-exercise`
- Set check -> `POST /set/complete`
- Finish workout -> `POST /workout/finish`
- Calendar read -> `GET /calendar`
- Sick day action -> `POST /calendar/sick`
- Offline reconciliation -> `POST /sync`

Headers required:

- `x-api-key: <VPULZ_API_KEY>`
- `Authorization: Bearer <SUPABASE_ACCESS_TOKEN>`

## Environment Variables

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MOTIA_BASE_URL`
- `MOTIA_API_KEY`
- `GROQ_API_KEY`
- `GEMINI_API_KEY`
- `GROQ_MODEL` (optional)
- `GEMINI_MODEL` (optional)
- `AI_PROVIDER_ORDER` (default: `groq,gemini`)
