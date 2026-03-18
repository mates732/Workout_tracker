# Fitness Coach App (Production Scaffold)

A clean-architecture, modular, security-conscious template for an AI fitness coaching SaaS.

## Quick start

1. Copy env template:
   ```bash
   cp .env.example .env
   ```
2. Start services:
   ```bash
   docker-compose up --build
   ```
3. Backend API: `http://localhost:8000/health`
4. Frontend: `http://localhost:3000`

## Mobile App (Expo Go)

The mobile client now lives in `frontend/` as an Expo app.

Run it from the frontend folder:

```bash
cd frontend
npm install
npx expo start
```

Important for Expo Go:

- Use your machine's LAN IP in the app for the API base URL, not `localhost`
- Default API key is `dev-key` unless overridden by backend environment variables

### Mobile coverage

The Expo client now supports:

- user profile load/save
- active workout visibility
- workout history and analytics refresh
- exercise search and custom exercise creation
- logging sets into the active workout
- asking the AI trainer with full user/training context

## Architecture

- `backend/src/core` — settings, app bootstrap
- `backend/src/controllers` — HTTP orchestration
- `backend/src/services` — application/use-case layer
- `backend/src/models` — typed domain models
- `backend/src/routes` — API route composition
- `backend/src/middleware` — auth/security middleware
- `backend/src/utils` — shared helpers
- `frontend/src` — UI components/pages/services/theme styles
- `database` — SQL schema + migration placeholders
- `docs` — security and architecture notes

## Security

- Bearer token auth middleware (timing-safe compare)
- Sliding-window rate limiting middleware
- Environment-based secret configuration
