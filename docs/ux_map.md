# VPULZ Mobile UX Restructure Blueprint

## Product intent
The app is now a guided training tool. Every screen must answer a single question in under one second: **"What should the user do right now?"**

---

## Global navigation (hard limit)
Bottom navigation has exactly 4 items:
1. Home
2. Workout
3. Progress
4. Profile

No additional primary tabs are allowed.

---

## Spacing + hierarchy system

### Spacing scale
- `xs`: 4px
- `sm`: 8px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px
- `xxl`: 48px
- `hero`: 64px

### Hierarchy rules
- **Title**: 32-40px, semibold.
- **Primary action label**: 24-28px, semibold.
- **Section label**: 16-18px, medium.
- **Metadata**: 12-14px, regular, gray.

### Color rules
- Background: pure black or near-black only.
- Text: white + gray only.
- Accent: one accent color only across the full app.

---

## Home screen (decision screen, not dashboard)

### User question
**"Do I start or continue training?"**

### Exact layout
- **Top zone (20% height)**
  - Left-aligned headline only (single line): e.g., "Ready to train?"
- **Middle zone (55% height)**
  - One dominant primary action block (40-60% of visible viewport).
  - Action label examples: "Start Workout" / "Continue Workout".
- **Bottom zone (25% height)**
  - Maximum two quiet context rows:
    - Today's plan (muted)
    - Last workout summary or AI suggestion (muted)

### Hard removals
- No KPI grid
- No multi-card dashboard
- No competing CTAs
- No colorful tile matrix

---

## Workout screen (tool mode)

### User question
**"Which set do I log next?"**

### Exact layout
- Full-screen vertical list.
- Each exercise row includes:
  1. Exercise name (high contrast)
  2. Last performance (small gray text)
  3. Inline editable set fields for weight and reps
- Set inputs must be large touch targets and editable with one tap.
- No modal required for normal edits.

### Prominent actions (only)
- `+ Add Exercise`
- `Finish Workout`

### Hard removals
- No cards
- No drop shadows
- No heavy decorative containers

---

## Exercise library (minimal search tool)

### User question
**"What exercise am I looking for?"**

### Exact layout
- Top fixed search bar (always visible).
- One vertical result list below.
- One filter button; advanced filters stay hidden until tapped.

### Hard removals
- No exposed faceted control wall
- No visual clutter blocks

---

## Profile screen (settings architecture)

### User question
**"What part of my account/progress do I manage?"**

### Exact layout
- Simple list structure only, in this order:
  1. Progress
  2. Body Metrics
  3. Goals
  4. Workout History
- Optional right-side muted metadata allowed.

### Hard removals
- No card-based layout
- No dashboard analytics collage

---

## AI Coach floating control
- Circular button on screen edge.
- 50% opacity by default.
- May slide along edges only.
- Must never block primary action or active set input.

---

## Regression prevention rules
1. Each screen has exactly one dominant action.
2. Any screen with more than two secondary info blocks fails UX review.
3. New components must reuse existing primitives (headline, list row, primary action, metadata row, tab bar, edge FAB).
4. If user intent is not obvious in one second, the screen must be redesigned before release.

---

## Final acceptance check
A first-time user opens each screen and instantly knows:
- Home: start/continue workout.
- Workout: log next set.
- Library: search exercise.
- Profile: manage settings/progress areas.

If this is not true, the build fails design QA.
