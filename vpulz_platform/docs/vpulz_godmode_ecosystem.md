# VPULZ GODMODE ECOSYSTEM DESIGN (Production Blueprint)

This document defines a production-ready architecture for a strength platform designed for tens of millions of users.

---

## Platform North Star

- **Core value loop:** Log workout -> Get AI insight -> Take action -> Share progress -> Invite friends -> Improve consistency.
- **Defensibility moat:** AI Strength Twin + Global Strength Intelligence + social graph + longitudinal behavior data.
- **Scale target:** 10M+ MAU, 100k+ concurrent sessions, sub-200ms for core logging paths.

---

## Canonical UX Macro-Flow

1. Home (readiness, today's plan, streak, AI cue)
2. Workout (ultra-fast set logger + real-time AI companion)
3. Progress (bench/squat/deadlift/OHP trends + projections)
4. Social (feed, rivalries, leaderboards, events)
5. Wrapped / Share moments (viral loop)

---

## 1) AI Strength Twin

### Product design
Digital athlete model simulates outcomes under frequency, volume, bodyweight, split, and rep-range changes.

### UX flow
Progress -> "Simulate Scenario" -> tweak variables -> projected strength curves at 4w/12w/6m/12m.

### AI models
- Time-series forecaster (hybrid Bayesian + gradient boosting)
- Constraint rules (fatigue/recovery bounds)

### Data pipeline
Workout/sets + bodyweight + sleep/recovery ingestion -> feature store -> model inference service.

### DB schema
`strength_twin_profiles`, `strength_twin_scenarios`, `strength_twin_forecasts`.

### Backend architecture
`services/strength_twin_service.py`, async forecast jobs, model cache.

### API endpoints
- `POST /ai/twin/scenarios`
- `GET /ai/twin/scenarios/{id}`
- `GET /ai/twin/forecast/{user_id}`

### Mobile integration
Scenario slider UI, forecast chart cards, "apply plan" CTA.

---

## 2) Training DNA Engine

### Product design
Learns tolerance for volume, intensity, recovery speed, fatigue accumulation, and optimal frequency.

### UX flow
Profile -> Training DNA card -> "Why" explanation -> personalized weekly prescription.

### AI models
Latent profile clustering + contextual bandits for next-cycle recommendations.

### Data pipeline
Weekly aggregates + adherence + RPE patterns -> DNA feature vectors -> profile assignment.

### DB schema
`training_dna_profiles`, `dna_observations`.

### Backend architecture
Batch recompute nightly + online incremental updates after each workout.

### API endpoints
- `GET /ai/dna/{user_id}`
- `POST /ai/dna/recompute/{user_id}`

### Mobile integration
DNA badge + explanation chips ("High intensity responder").

---

## 3) Weak Point Detection

### Product design
Identifies phase weaknesses (e.g., deadlift off-floor) and prescribes accessories.

### UX flow
Lift detail -> Weak-point panel -> corrective blocks -> add-to-plan.

### AI models
Rule + classifier ensemble using rep/RPE drop-off + velocity proxy if available.

### Data pipeline
Set-level performance deltas + failure positions (manual/video tags) -> weakness labels.

### DB schema
`lift_weakness_signals`, `corrective_recommendations`.

### Backend architecture
Weakness analyzer service + recommendation ranking engine.

### API endpoints
- `GET /ai/weakness/{user_id}/{lift}`
- `POST /ai/weakness/video-tag`

### Mobile integration
Weakness timeline + one-tap accessory insertion.

---

## 4) AI Workout Companion

### Product design
Real-time guidance: increase/decrease load, extend rest, or cap session.

### UX flow
During workout -> after each set show recommendation chip.

### AI models
Policy engine with safety constraints + contextual decision model.

### Data pipeline
Recent sets stream -> feature computation (fatigue slope) -> recommendation engine.

### DB schema
`companion_events`, `companion_decisions`.

### Backend architecture
Low-latency inference endpoint (<120ms) with edge caching.

### API endpoints
- `POST /ai/companion/evaluate-set`
- `GET /ai/companion/session-summary/{workout_id}`

### Mobile integration
Inline feedback toast + haptic cue.

---

## 5) Gym Intelligence Map

### Product design
Shows best weekdays/times, high-output sessions, fatigue windows.

### UX flow
Insights -> heatmap calendar -> "train at your peak window" suggestion.

### AI models
Seasonal decomposition + session-performance scoring.

### Data pipeline
Timestamped sessions -> hourly/day heatmaps -> recommendation candidates.

### DB schema
`gym_intelligence_windows`.

### Backend architecture
Precomputed user aggregates + cache invalidation on new workouts.

### API endpoints
- `GET /insights/gym-map/{user_id}`

### Mobile integration
Calendar heatmap component.

---

## 6) Future Self Projection

### Product design
Shows expected lift outcomes at 3/6/12 months.

### UX flow
Projection card -> shareable future strength image.

### AI models
Medium-horizon forecast with confidence intervals.

### Data pipeline
Strength twin forecast snapshots -> render payload.

### DB schema
`future_self_projections`.

### Backend architecture
Snapshot service + image renderer queue.

### API endpoints
- `GET /projections/{user_id}`
- `POST /projections/share-card/{user_id}`

### Mobile integration
3-stage projection carousel.

---

## 7) Hero Journey Timeline

### Product design
Storyline of milestones, PRs, streaks, and consistency arcs.

### UX flow
Progress -> Timeline -> tap milestone for details.

### AI models
Event extraction from workout timeline.

### Data pipeline
Detect milestone events from longitudinal logs.

### DB schema
`hero_timeline_events`.

### Backend architecture
Event detector + timeline composer.

### API endpoints
- `GET /journey/timeline/{user_id}`

### Mobile integration
Vertical timeline with milestone badges.

---

## 8) Global Strength Intelligence Engine

### Product design
Aggregated anonymized intelligence over all users.

### UX flow
Insights -> "What works globally" cards filtered by profile.

### AI models
Causal-ish estimators, uplift modeling, nearest-neighbor cohorts.

### Data pipeline
PII-stripped events -> warehouse/lakehouse -> feature marts -> model training.

### DB schema
`global_aggregate_metrics`, `cohort_models`, `recommendation_evidence`.

### Backend architecture
Data platform (stream + batch), model registry, offline-to-online serving.

### API endpoints
- `GET /global/intelligence/{user_id}`

### Mobile integration
"Backed by users like you" evidence cards.

---

## 9) Global Strength Benchmarks

### Product design
Percentile rank by weight class, age band, sex, experience.

### UX flow
Benchmark page -> percentile chip + path-to-next-percentile plan.

### AI models
Percentile estimation + trajectory-to-target model.

### Data pipeline
Aggregated cohort stats recomputed daily.

### DB schema
`strength_benchmarks`, `user_percentiles`.

### Backend architecture
Benchmark service with cached percentile tables.

### API endpoints
- `GET /global/benchmarks/{user_id}`

### Mobile integration
Percentile donut + progress-to-goal bar.

---

## 10) Global Training Knowledge Graph

### Product design
Graph linking exercises, plans, outcomes, contexts.

### UX flow
AI coach answer includes graph-backed "why this works".

### AI models
Graph embeddings + retrieval + ranker.

### Data pipeline
Outcome edges from anonymized users -> graph ETL.

### DB schema
`knowledge_nodes`, `knowledge_edges`, pgvector embeddings.

### Backend architecture
Graph service + RAG retriever.

### API endpoints
- `GET /global/knowledge/recommendations/{user_id}`

### Mobile integration
Explainable recommendation cards.

---

## 11-13) Gamification (Level, Quests, Streak)

- XP: workout, PR, streak multipliers.
- Quests: weekly/monthly dynamic objectives.
- Streak engine: warns before break, supports streak shields.

APIs:
- `GET /gamification/profile/{user_id}`
- `GET /gamification/quests/{user_id}`
- `POST /gamification/quests/{quest_id}/claim`
- `GET /gamification/streak/{user_id}`

---

## 14-16) Social (Rivalries, Leaderboards, Feed)

- Rivalries: invite/challenge lifters on core lifts.
- Leaderboards: city/country/gym/weight class.
- Feed: PRs, milestones, workout summaries.

APIs:
- `POST /social/rivalries`
- `GET /social/leaderboards`
- `GET /social/feed/{user_id}`

---

## 17-21) Viral Growth

- Wrapped (weekly/bi-weekly/monthly)
- PR share cards
- Archetype labels
- Future self share cards
- Beat Me challenge links

APIs:
- `GET /wrapped/{user_id}`
- `POST /share/pr-card/{user_id}`
- `GET /archetype/{user_id}`
- `POST /share/future-self/{user_id}`
- `POST /challenge-links`

---

## 22-29) Unicorn Layer

- Global Strength Index (ELO-like strength rating)
- Gym Network Map
- AI Injury Prevention
- Program Autopilot
- Adaptive Deload
- Strength Economy
- Social Gym Events
- Gym MMORPG systems

APIs:
- `GET /gsi/{user_id}`
- `GET /gyms/map`
- `GET /risk/injury/{user_id}`
- `POST /autopilot/plan/{user_id}`
- `POST /deload/recommend/{user_id}`
- `GET /economy/wallet/{user_id}`
- `GET /events`
- `GET /mmorpg/profile/{user_id}`

---

## Core scalable architecture

- **Data plane:** Kafka/PubSub streams + warehouse + feature store.
- **Serving plane:** FastAPI microservices behind API gateway.
- **AI plane:** model router (fast vs reasoning), retriever, safety policy.
- **Storage:** Postgres + Redis + object storage + vector index (pgvector).
- **Ops:** CI/CD, canary deploys, observability (metrics/traces/logs), feature flags.

---

## Mobile integration contract

All endpoints return:
- `summary` (for immediate card rendering)
- `details` (deep views)
- `share_payload` (title, metric, caption, branding)

Offline-first:
- local queue for set logs
- eventual sync with conflict resolution on timestamp + device revision.
