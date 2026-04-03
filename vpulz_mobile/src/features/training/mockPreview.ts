import type { PlannedWorkout } from '../../shared/state/settingsLogic';

export const mockPlannedWorkout: PlannedWorkout = {
  date: new Date().toISOString().slice(0, 10),
  splitType: 'full',
  preview: {
    id: 'demo-1',
    splitKey: 'full body',
    title: 'Full Body Strength',
    summary: '4 exercises, quick strength session',
    recommendation: 'Coach Boost: steady load, aim for quality reps.',
    inlineCoachIntro: 'Short warm-up then heavy sets.',
    recoveryNote: 'Light cooldown after session.',
    estimatedDurationMin: 40,
    progressionLabel: 'build',
    exercises: [
      {
        name: 'Barbell Back Squat',
        muscleGroup: 'Quads',
        equipment: 'Barbell',
        targetSets: 4,
        targetReps: 5,
        targetWeightKg: 95,
        coachCue: 'Brace and drive through the heels.',
      },
      {
        name: 'Romanian Deadlift',
        muscleGroup: 'Posterior Chain',
        equipment: 'Barbell',
        targetSets: 3,
        targetReps: 6,
        targetWeightKg: 120,
        coachCue: 'Hinge from the hips and control descent.',
      },
      {
        name: 'Pull-ups',
        muscleGroup: 'Back',
        equipment: 'Bodyweight',
        targetSets: 3,
        targetReps: 6,
        targetWeightKg: 0,
        coachCue: 'Full range of motion, controlled descent.',
      },
      {
        name: 'Incline Dumbbell Press',
        muscleGroup: 'Chest',
        equipment: 'Dumbbell',
        targetSets: 3,
        targetReps: 8,
        targetWeightKg: 26,
        coachCue: 'Stay tight and press with intent.',
      },
    ],
  },
};

export default mockPlannedWorkout;
