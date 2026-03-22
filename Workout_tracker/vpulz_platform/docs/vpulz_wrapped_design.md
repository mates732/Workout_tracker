# VPULZ WRAPPED

## 1) Complete product feature design

**Feature:** VPULZ Wrapped (weekly, bi-weekly, monthly)

VPULZ Wrapped is a cinematic recap engine that turns raw training logs into a story users want to replay and share.

Core outcomes:
- Motivation loop: reveal progress in a celebratory narrative format.
- Emotional engagement: strongest moment, comeback workout, personality identity.
- Retention: period-end recap + CTA for the next cycle.
- Viral sharing: precomposed branded slides for social export.

Primary recap cards:
- Sessions completed
- Total volume lifted
- Dominant exercise
- Biggest lift
- PR count
- Strength trend
- Productive day
- Training personality
- Fatigue phase highlight

## 2) UX flow

1. Push/in-app notification: **"Your VPULZ Wrapped is ready."**
2. User enters full-screen story mode.
3. Swipe gesture moves card-to-card (6–10 cards per period).
4. Animated counters and highlight motion reveal each insight.
5. User can tap **Share** on any card.
6. Final card: challenge CTA (**"Ready to beat this next cycle?"**).
7. Optional deep-dive button opens full analytics dashboard.

Interaction details:
- Horizontal swipe + long-press pause (story standard).
- Bold headline + one hero metric per card.
- Progress dots at top for completion feedback.
- Dark premium theme with gradient accents and VPULZ watermark.

## 3) Analytics calculations

Windowing:
- Weekly: last 7 days
- Bi-weekly: last 14 days
- Monthly: last 30 days

Metric formulas:
- `sessions = count(workouts in window)`
- `total_volume = sum(weight * reps for every set)`
- `dominant_exercise = argmax(exercise_set_count)`
- `biggest_lift = max(set.weight)`
- `consistency_score = min(100, sessions * 5.5)`
- `strength_growth_pct = ((latest_est_1rm - baseline_est_1rm)/baseline_est_1rm)*100`
- `longest_streak_days = longest consecutive workout-date run`
- `most_productive_day = day_of_week with highest volume`
- `fatigue_peak_week = high-RPE concentration week`

Derived labels:
- Personality examples:
  - **The Grinder**: high consistency + high volume
  - **The Power Builder**: high intensity pattern

## 4) Backend architecture

Implemented modules:
- `backend/services/wrapped_service.py`
  - data scoping by period
  - metric aggregation
  - AI-style commentary synthesis
  - slide object generation
- `backend/schemas/wrapped.py`
  - request/response and slide schema
- `backend/api/wrapped.py`
  - endpoint: `GET /wrapped/{user_id}?period=monthly`
- `backend/core/container.py`
  - shared singleton service wiring with `wrapped` service

Pipeline:
1. Fetch workouts by user from repository.
2. Filter by wrapped period.
3. Compute metrics.
4. Generate narrative insights and slide payloads.
5. Return a share-ready story response.

## 5) Database queries

```sql
-- workouts in wrapped window
SELECT *
FROM workouts
WHERE user_id = :user_id
  AND started_at >= NOW() - INTERVAL '30 days';

-- total volume
SELECT SUM(s.weight * s.reps) AS total_volume
FROM sets s
JOIN workout_exercises we ON we.id = s.workout_exercise_id
JOIN workouts w ON w.id = we.workout_id
WHERE w.user_id = :user_id
  AND w.started_at >= NOW() - INTERVAL '30 days';

-- dominant exercise
SELECT e.name, COUNT(*) AS set_count
FROM sets s
JOIN workout_exercises we ON we.id = s.workout_exercise_id
JOIN workouts w ON w.id = we.workout_id
JOIN exercises e ON e.id = we.exercise_id
WHERE w.user_id = :user_id
  AND w.started_at >= NOW() - INTERVAL '30 days'
GROUP BY e.name
ORDER BY set_count DESC
LIMIT 1;

-- biggest lift
SELECT e.name, MAX(s.weight) AS max_weight
FROM sets s
JOIN workout_exercises we ON we.id = s.workout_exercise_id
JOIN workouts w ON w.id = we.workout_id
JOIN exercises e ON e.id = we.exercise_id
WHERE w.user_id = :user_id
  AND w.started_at >= NOW() - INTERVAL '30 days'
GROUP BY e.name
ORDER BY max_weight DESC
LIMIT 1;
```

## 6) AI insight generation logic

LLM + rules hybrid:
- Rules first for deterministic facts (cost efficient).
- Prompt LLM only for stylistic summary and motivational framing.

Prompt ingredients:
- profile goal + level
- wrapped metrics
- trend deltas
- fatigue/streak context

Style policy:
- concise, supportive tone
- no unsafe training instructions
- always end with challenge-oriented next step

## 7) Social sharing system

Share payload per slide:
- `title`
- `hero metric`
- `caption`
- `brand watermark`
- `period badge`

Export modes:
- 9:16 (Instagram Story, TikTok)
- 1:1 (feed posts)

Share flow:
1. tap Share on card
2. render branded image/video snapshot
3. open native share sheet
4. attach caption + hashtag template

Example caption template:
`My VPULZ Wrapped: {metric_value}. Next cycle starts now. #VPULZ #GymProgress`

## 8) Implementation strategy

Phase 1 (1-2 weeks):
- backend wrapped aggregation + API
- static slide payload
- internal QA with seeded users

Phase 2 (2-3 weeks):
- mobile story UI + animated counters
- share-image renderer
- A/B test notification timing

Phase 3 (2 weeks):
- AI narrative personalization
- personality archetypes and comeback moments
- growth experiments (share incentives)

Success metrics:
- wrapped open rate
- completion rate per story
- share rate
- D30 retention lift for wrapped viewers vs control
