# VPULZ Workout Tracking System

## Product Goal
Fastest possible workout logging flow with minimal cognitive load.

- Target: set logging in under 2 seconds
- Constraint: black/white/grayscale only
- UX model: tool, not dashboard

## System States

### 1) Start
- Primary CTA:
  - `Continue Workout` when active workout exists
  - `Start Workout` otherwise
- Secondary quick options:
  - Start empty
  - Start from plan
  - Resume unfinished

### 2) Active Workout (Execution)
- Vertical-only flow with exercise blocks
- Exercise block:
  - exercise name (dominant)
  - previous performance (small gray)
  - fast set-entry row: weight + reps (+ optional RPE)
- Set row actions (inline only):
  - complete / uncomplete
  - edit weight/reps
  - duplicate
  - delete (soft hide)
- Exercise actions:
  - add via instant search
  - add from recents
  - add from favorites
  - create custom exercise
  - reorder (quick move controls)
  - superset link with previous exercise (visual group)
- Optional notes:
  - per set (inline)
  - per exercise
  - per workout
- Timer:
  - auto rest timer after set log
  - manual +15s / stop
  - persisted in draft state

### 3) Summary
- Minimal metrics:
  - duration
  - total volume
  - total sets
- Reflection:
  - PR highlight
  - one-line insight
- CTA:
  - Done (return to Home)

## AI Trainer Integration

- Dedicated `Coach` tab for question-answer flow
- Uses live context:
  - active workout (exercise/set count)
  - pending offline sync queue
  - recent completed workout history
- Backend endpoint:
  - `POST /assistant/ask`
- Offline fallback:
  - local coach response heuristics for progression/fatigue guidance

## Data Model

### Remote API model (server)
- WorkoutSession
- WorkoutExerciseState
- LoggedSet

### Local tracker model (device)
Defined in `src/features/workout/workoutTracker.types.ts`:
- `WorkoutDraft`
  - exercise order
  - next-set drafts
  - set notes
  - workout note
  - rest timer state
- `PendingAction`
  - queue of offline actions to sync later
- `TrackerSessionSnapshot`
  - drafts
  - pending queue
  - favorites
  - recents
  - workoutHistory

## State Management

Main runtime state in `src/shared/state/WorkoutFlowContext.tsx`:
- network-backed workout session state
- start mode API (`startWorkoutByMode`) for empty, plan, resume
- draft persistence API (`saveWorkoutDraft`, `getWorkoutDraft`, `clearWorkoutDraft`)
- offline queue API (`queuePendingAction`, `flushPendingQueue`)
- favorites + recents API

Persistence in `src/shared/state/workoutTrackerStore.ts`:
- AsyncStorage snapshot load/save
- crash-safe local draft restore

## Interaction Flow

Home -> Active Workout -> Summary -> Home

Active workout micro-loop:
1. Edit inline weight/reps
2. Tap `Log Set`
3. Auto-save
4. Rest timer starts
5. Focus returns to weight input
6. Continue next set

## Performance Strategy

- Optimistic local fallback on network failure (temp sets)
- Queue unsynced actions for later flush
- Autosave every state mutation into AsyncStorage snapshot
- Debounced exercise search
- Smooth lightweight animations (`LayoutAnimation`, press scale)

## UX Constraints

- One dominant action per screen
- Max two taps for common actions
- No modals for critical logging
- No charting during workout
- Black/white/grayscale palette

## Validation Checklist

- Can user log set in <2s? (weight + reps + enter)
- Can user continue when offline? (yes via queued actions + temp sets)
- Is there unnecessary UI clutter? (if yes, remove)
- Is focus always on execution? (yes: vertical tool layout)
