# AI Fitness Coaching Platform (Production Scaffold)

This repository provides a modular Python 3.11+ backend intelligence layer for a startup-grade AI fitness SaaS product.

## Platform capabilities

- AI workout generation and substitutions
- Workout session logging, PR detection, and summaries
- Fatigue + autoregulation + readiness scoring
- Progression, periodization, and training load management
- Recovery estimation, warmup generation, injury prevention
- Goal system, habits, gamification, coaching tips
- Exercise intelligence and equipment-aware filtering
- Analytics, export system, and digital twin simulation
- UI theme system (light/dark color scales) and component descriptors

## Architecture

- `src/workout_tracker/core/` — domain dataclasses and enums
- `src/workout_tracker/services/` — modular intelligence services
- `src/workout_tracker/ui/` — theme scale + UI component metadata
- `src/workout_tracker/api/` — request contract models
- `project_name/` — startup-style directory scaffold (`core/`, `services/`, `models/`, `api/`, `database/`, `ui/`, `config/`, `tests/`)

## Theme system highlights

- **Light**: neutral slate backgrounds + indigo primary + teal accent gradients
- **Dark**: deep slate surfaces + violet primary + cyan accent gradients
- Both themes provide `50..900` shade scales per palette.

## Run tests

```bash
PYTHONPATH=src pytest -q
```
