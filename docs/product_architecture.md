# AI Fitness Coaching App — Product Architecture

## Product architecture

### System topology
- Frontend: Next.js + React + TypeScript + TailwindCSS
- Backend API: Node.js + Express (JWT auth)
- Data: PostgreSQL via Prisma ORM
- Python AI domain module (this repo) for deterministic planning/fatigue/autoregulation logic

### Core connected systems
1. AI Workout Generator
2. Exercise Library / CSV ingestion
3. Diet Phase Planner
4. Calendar Planning Service
5. Transformation Prediction Engine
6. Muscle Fatigue + Recovery Model
7. Autoregulation Service
8. Workout Session Service

### API surface
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/workouts/generate`
- `POST /api/workouts/start`
- `POST /api/workouts/complete`
- `GET /api/exercises`
- `POST /api/progress/log`
- `POST /api/predictions/generate`
- `GET /api/calendar/events`

### Fatigue and autoregulation design
- Workout exercises map to fatigue points by category (3/2/1 model).
- Fatigue is aggregated per muscle and decays by muscle-specific recovery windows.
- Readiness signals include completed reps, average RPE, consistency, sleep, and fatigue.
- Planner adjusts load/intensity/volume for next workout with deterministic safety rules.
