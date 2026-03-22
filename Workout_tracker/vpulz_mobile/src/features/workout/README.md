# VPULZ Premium Workout Logger

## Structure

- **WorkoutLoggerScreen.tsx**: Main entry for the new workout logging experience
- **components/**: Modular UI components (TopBar, Timer, Cards, Modals, etc)
- **state/**: Context and timer logic
- **styles/**: Shared styles

## Key Features
- Custom top bar with minimize, timer, finish
- Minimized mode with persistent state
- Global timer (stopwatch/rest)
- Exercise library (search/filter)
- Exercise detail modal
- Exercise cards with set system
- Add set, reorder, superset, notes, etc
- Modern dark UI, smooth animations

## Next Steps
- Implement reducer logic in workoutContext
- Build out ExerciseLibrary and ExerciseDetail modals
- Connect state/actions to UI
- Add advanced animations and performance optimizations
