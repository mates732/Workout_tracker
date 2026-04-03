import type { Workout } from './types';

export const mockWorkout: Workout = {
  id: 'w-1',
  title: 'Full Body Strength',
  durationMin: 48,
  splitType: 'Full Body',
  previousPerformance: {
    lastDate: '2026-03-29',
    streak: 4,
    prToday: false,
  },
  exercises: [
    {
      id: 'ex-1',
      name: 'Barbell Back Squat',
      isHighlighted: true,
      previousBestKg: 105,
      sets: [
        { reps: 5, weight: 95 },
        { reps: 5, weight: 95 },
        { reps: 5, weight: 100 },
      ],
    },
    {
      id: 'ex-2',
      name: 'Romanian Deadlift',
      previousBestKg: 140,
      sets: [
        { reps: 6, weight: 120 },
        { reps: 6, weight: 120 },
      ],
    },
    {
      id: 'ex-3',
      name: 'Pull-ups',
      previousBestKg: 0,
      sets: [
        { reps: 8 },
        { reps: 8 },
        { reps: 6 },
      ],
    },
  ],
};

export default mockWorkout;
