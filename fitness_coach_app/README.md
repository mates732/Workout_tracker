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

## Testing on a physical device (same Wi-Fi)

When you open the app on a phone or tablet that is on the same Wi-Fi network as
your development machine, the browser cannot reach `localhost` on your PC.
Two small adjustments are needed:

1. **Find your machine's LAN IP address** (e.g. `192.168.1.100`):
   - macOS: `ipconfig getifaddr en0`
   - Linux: `hostname -I | awk '{print $1}'`
   - Windows: `ipconfig` (look for "IPv4 Address")

2. **Allow that origin in the backend** by editing `.env`:
   ```
   CORS_ORIGINS=http://localhost:3000,http://192.168.1.100:3000
   ```

3. **Open the app on the device** using the machine's LAN IP:
   ```
   http://192.168.1.100:3000
   ```

The frontend automatically uses the hostname it was loaded from, so API calls
will be sent to `http://192.168.1.100:8000` — your dev machine — rather than
the device itself.

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
- CORS origins restricted to explicitly listed values via `CORS_ORIGINS`
