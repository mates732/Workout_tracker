# VPULZ Backend + AI Core

Production-ready modular backend scaffold for the VPULZ premium strength companion.

## Run locally
```bash
PYTHONPATH=vpulz/backend uvicorn core.app:app --reload --port 8100
```

## Structure
- `backend/core` app + config
- `backend/models` domain models
- `backend/repositories` persistence abstractions
- `backend/services` workout/routine/progress logic
- `backend/ai` orchestrator + provider adapters + retrieval
- `backend/routes` HTTP API layer
- `database/schema.sql` PostgreSQL + pgvector schema
- `docs/` architecture and endpoint contracts
