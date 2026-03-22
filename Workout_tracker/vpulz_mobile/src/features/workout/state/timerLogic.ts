// Reusable timer logic for workout and rest
export function useTimer(initial = 0, running = true) {
  // Implement timer logic (start, pause, reset, switch mode)
  // Returns { seconds, running, mode, ... }
  return { seconds: initial, running, mode: 'stopwatch' };
}
