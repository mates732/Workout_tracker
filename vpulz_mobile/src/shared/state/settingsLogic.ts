import type { SetSuggestion, WorkoutExerciseState } from '../api/workoutApi';
import type { UserAppSettings, Weekday } from './userAppSettingsStore';

export type WorkoutSummaryInput = {
  performance: number;
  prs: number;
  totalSets?: number;
  totalVolume?: number;
  adherence?: number;
};

export type ProgressionExercise = {
  completed_reps: number;
  target_reps: number;
  weight: number;
};

export type WorkoutTrackingSet = {
  reps: number;
  weight: number;
};

export type WorkoutTrackingExercise = {
  name: string;
  sets: WorkoutTrackingSet[];
  completed: boolean;
};

export type WorkoutTrackingModel = {
  workout_id: string;
  date: string;
  exercises: WorkoutTrackingExercise[];
  duration_min: number;
  performance_score: number;
  prs: number;
};

export type GeneratedWorkoutExercise = {
  name: string;
  muscleGroup: string;
  equipment: string;
  targetSets: number;
  targetReps: number;
  targetWeightKg: number;
  coachCue: string;
};

export type GeneratedWorkout = {
  id: string;
  goal: UserAppSettings['profile']['goal'];
  level: UserAppSettings['profile']['level'];
  duration: number;
  equipment: UserAppSettings['workout']['equipment'];
  split: UserAppSettings['workout']['training_type'];
  splitKey: string;
  title: string;
  summary: string;
  recommendation: string;
  inlineCoachIntro: string;
  recoveryNote: string;
  estimatedDurationMin: number;
  progressionLabel: 'build' | 'hold' | 'reload';
  exercises: Array<{
    name: string;
    muscleGroup: string;
    equipment: string;
    sets: number;
    reps: number;
    weightKg: number;
    coachCue: string;
  }>;
};

export type AdaptiveWorkoutPlan = {
  id: string;
  splitKey: string;
  title: string;
  summary: string;
  recommendation: string;
  inlineCoachIntro: string;
  recoveryNote: string;
  estimatedDurationMin: number;
  progressionLabel: 'build' | 'hold' | 'reload';
  exercises: GeneratedWorkoutExercise[];
};

export type LastWorkoutExerciseSummary = {
  name: string;
  sets: number;
  topWeight: number;
  topReps: number;
};

export type LastWorkoutSummary = {
  id: string;
  completedAt: string;
  durationMinutes: number;
  totalVolume: number;
  totalSets: number;
  completedSets: number;
  performance: number;
  prs: number;
  splitKey: string;
  feedback: string | null;
  summaryLine: string;
  exercises: LastWorkoutExerciseSummary[];
};

export type InlineCoachInput = {
  plan: AdaptiveWorkoutPlan | null;
  completedSets: number;
  totalPlannedSets: number;
  elapsedSeconds: number;
  latestSuggestion?: SetSuggestion | null;
  settings: UserAppSettings;
};

export type SetFeedbackSnapshot = {
  difference_weight: number | null;
  difference_reps: number | null;
  pr: boolean;
};

export type BuildSetSuggestionInput = {
  exerciseName: string;
  setNumber: number;
  weight: number;
  reps: number;
  planExercise: GeneratedWorkoutExercise | null;
  totalWorkoutSets: number;
};

export type FinishedWorkoutSummaryInput = {
  workoutId: string;
  completedAt: string;
  elapsedSeconds: number;
  exercises: WorkoutExerciseState[];
  plan: AdaptiveWorkoutPlan | null;
  previousSummary?: LastWorkoutSummary | null;
  history?: LastWorkoutSummary[];
  settings: UserAppSettings;
};

type GenerateWorkoutOptions = {
  lastWorkout?: LastWorkoutSummary | null;
  workoutHistory?: LastWorkoutSummary[];
  splitKeyOverride?: SplitKey;
};

type ExerciseBlueprint = {
  name: string;
  muscleGroup: string;
  equipment: string;
  baseWeightKg: number;
  baseReps: number;
  coachCue: string;
};

type SplitKey = 'push' | 'pull' | 'legs' | 'full body' | 'upper' | 'lower';

export type PlannedSplitType = string;

export type PlannedWorkout = {
  date: string;
  splitType: PlannedSplitType;
  preview: AdaptiveWorkoutPlan;
};

const WEEKDAY_BY_INDEX: Weekday[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

function toIsoDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function toPlannedSplitKey(splitType: PlannedSplitType): SplitKey {
  const normalized = String(splitType).trim().toLowerCase();

  if (normalized === 'push') {
    return 'push';
  }
  if (normalized === 'pull') {
    return 'pull';
  }
  if (normalized === 'legs') {
    return 'legs';
  }
  if (normalized === 'upper') {
    return 'upper';
  }
  if (normalized === 'lower') {
    return 'lower';
  }
  if (normalized === 'full' || normalized === 'full body') {
    return 'full body';
  }

  return 'full body';
}

function toAdaptivePlanFromGenerated(workout: GeneratedWorkout, date?: string): AdaptiveWorkoutPlan {
  return {
    id: date ? `${workout.id}-${date}` : workout.id,
    splitKey: workout.splitKey,
    title: workout.title,
    summary: workout.summary,
    recommendation: workout.recommendation,
    inlineCoachIntro: workout.inlineCoachIntro,
    recoveryNote: workout.recoveryNote,
    estimatedDurationMin: workout.estimatedDurationMin,
    progressionLabel: workout.progressionLabel,
    exercises: workout.exercises.map<GeneratedWorkoutExercise>((exercise) => ({
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
      targetSets: exercise.sets,
      targetReps: exercise.reps,
      targetWeightKg: exercise.weightKg,
      coachCue: exercise.coachCue,
    })),
  };
}

const LEVEL_MULTIPLIER: Record<UserAppSettings['profile']['level'], number> = {
  beginner: 0.72,
  intermediate: 1,
  advanced: 1.14,
};

const GOAL_REP_ADJUSTMENT: Record<UserAppSettings['profile']['goal'], number> = {
  fat_loss: 2,
  maintenance: 0,
  muscle_gain: 1,
};

const TRAINING_SPLITS: Record<UserAppSettings['workout']['training_type'], SplitKey[]> = {
  push_pull_legs: ['push', 'pull', 'legs'],
  full_body: ['full body'],
  split: ['upper', 'lower'],
  custom: ['full body'],
};

const SPLIT_TITLES: Record<SplitKey, string> = {
  push: 'Push Builder',
  pull: 'Pull Progression',
  legs: 'Leg Day Drive',
  'full body': 'Full Body Foundation',
  upper: 'Upper Body Focus',
  lower: 'Lower Body Focus',
};

const EXERCISE_LIBRARY: Record<SplitKey, ExerciseBlueprint[]> = {
  push: [
    {
      name: 'Barbell Bench Press',
      muscleGroup: 'Chest',
      equipment: 'Barbell',
      baseWeightKg: 60,
      baseReps: 8,
      coachCue: 'Own the descent and drive the bar up with intent.',
    },
    {
      name: 'Incline Dumbbell Press',
      muscleGroup: 'Upper Chest',
      equipment: 'Dumbbell',
      baseWeightKg: 24,
      baseReps: 10,
      coachCue: 'Stay stacked through your ribs and finish every rep high.',
    },
    {
      name: 'Seated Dumbbell Shoulder Press',
      muscleGroup: 'Shoulders',
      equipment: 'Dumbbell',
      baseWeightKg: 18,
      baseReps: 10,
      coachCue: 'Keep your elbows under the bells and avoid rushing lockout.',
    },
    {
      name: 'Cable Triceps Pressdown',
      muscleGroup: 'Triceps',
      equipment: 'Cable',
      baseWeightKg: 18,
      baseReps: 12,
      coachCue: 'Pin the elbows and squeeze hard through the finish.',
    },
  ],
  pull: [
    {
      name: 'Romanian Deadlift',
      muscleGroup: 'Posterior Chain',
      equipment: 'Barbell',
      baseWeightKg: 70,
      baseReps: 8,
      coachCue: 'Push hips back first and keep the bar close to your legs.',
    },
    {
      name: 'Chest Supported Row',
      muscleGroup: 'Upper Back',
      equipment: 'Machine',
      baseWeightKg: 45,
      baseReps: 10,
      coachCue: 'Drive elbows low and pause for one clean count at the top.',
    },
    {
      name: 'Lat Pulldown',
      muscleGroup: 'Lats',
      equipment: 'Cable',
      baseWeightKg: 42,
      baseReps: 10,
      coachCue: 'Pull to the upper chest without losing your torso position.',
    },
    {
      name: 'Hammer Curl',
      muscleGroup: 'Biceps',
      equipment: 'Dumbbell',
      baseWeightKg: 14,
      baseReps: 12,
      coachCue: 'Stay strict and let the forearms finish the rep.',
    },
  ],
  legs: [
    {
      name: 'Back Squat',
      muscleGroup: 'Quads',
      equipment: 'Barbell',
      baseWeightKg: 70,
      baseReps: 6,
      coachCue: 'Brace before every rep and drive the floor away evenly.',
    },
    {
      name: 'Leg Press',
      muscleGroup: 'Legs',
      equipment: 'Machine',
      baseWeightKg: 120,
      baseReps: 10,
      coachCue: 'Control depth and keep steady pressure through mid-foot.',
    },
    {
      name: 'Walking Lunge',
      muscleGroup: 'Glutes',
      equipment: 'Dumbbell',
      baseWeightKg: 16,
      baseReps: 12,
      coachCue: 'Long controlled strides will keep tension on the target muscle.',
    },
    {
      name: 'Seated Leg Curl',
      muscleGroup: 'Hamstrings',
      equipment: 'Machine',
      baseWeightKg: 36,
      baseReps: 12,
      coachCue: 'Finish with a full squeeze and do not let the stack slam.',
    },
  ],
  'full body': [
    {
      name: 'Goblet Squat',
      muscleGroup: 'Legs',
      equipment: 'Dumbbell',
      baseWeightKg: 24,
      baseReps: 10,
      coachCue: 'Stay tall through the chest and keep every rep crisp.',
    },
    {
      name: 'Push-Up',
      muscleGroup: 'Chest',
      equipment: 'Bodyweight',
      baseWeightKg: 0,
      baseReps: 12,
      coachCue: 'Lock the body into one line and finish the press completely.',
    },
    {
      name: 'One Arm Dumbbell Row',
      muscleGroup: 'Back',
      equipment: 'Dumbbell',
      baseWeightKg: 20,
      baseReps: 10,
      coachCue: 'Pull elbow toward the hip and keep the torso quiet.',
    },
    {
      name: 'Dumbbell Romanian Deadlift',
      muscleGroup: 'Posterior Chain',
      equipment: 'Dumbbell',
      baseWeightKg: 22,
      baseReps: 10,
      coachCue: 'Hinge smoothly and keep a soft bend in the knees.',
    },
  ],
  upper: [
    {
      name: 'Incline Bench Press',
      muscleGroup: 'Upper Chest',
      equipment: 'Barbell',
      baseWeightKg: 52,
      baseReps: 8,
      coachCue: 'Keep the chest tall and let the bar travel consistently.',
    },
    {
      name: 'Seated Cable Row',
      muscleGroup: 'Back',
      equipment: 'Cable',
      baseWeightKg: 48,
      baseReps: 10,
      coachCue: 'Lead the pull with elbows and stay smooth on the return.',
    },
    {
      name: 'Lateral Raise',
      muscleGroup: 'Shoulders',
      equipment: 'Dumbbell',
      baseWeightKg: 10,
      baseReps: 14,
      coachCue: 'Lift with control and stop before the traps take over.',
    },
    {
      name: 'Cable Curl',
      muscleGroup: 'Biceps',
      equipment: 'Cable',
      baseWeightKg: 16,
      baseReps: 12,
      coachCue: 'Keep tension constant and do not swing through the bottom.',
    },
  ],
  lower: [
    {
      name: 'Front Squat',
      muscleGroup: 'Quads',
      equipment: 'Barbell',
      baseWeightKg: 55,
      baseReps: 6,
      coachCue: 'Keep elbows high and stay patient through the sticking point.',
    },
    {
      name: 'Hip Thrust',
      muscleGroup: 'Glutes',
      equipment: 'Barbell',
      baseWeightKg: 80,
      baseReps: 8,
      coachCue: 'Pause at full extension and keep your ribs stacked.',
    },
    {
      name: 'Bulgarian Split Squat',
      muscleGroup: 'Legs',
      equipment: 'Dumbbell',
      baseWeightKg: 16,
      baseReps: 10,
      coachCue: 'Stay balanced through the front foot and own the bottom.',
    },
    {
      name: 'Calf Raise',
      muscleGroup: 'Calves',
      equipment: 'Machine',
      baseWeightKg: 45,
      baseReps: 14,
      coachCue: 'Pause high, lower slowly, and chase full range every time.',
    },
  ],
};

const EQUIPMENT_FALLBACK_LIBRARY: Record<
  Exclude<UserAppSettings['workout']['equipment'], 'gym'>,
  Record<SplitKey, ExerciseBlueprint[]>
> = {
  home: {
    push: [
      {
        name: 'Push-Up',
        muscleGroup: 'Chest',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 12,
        coachCue: 'Stay rigid through the trunk and finish every press completely.',
      },
      {
        name: 'Floor Dumbbell Press',
        muscleGroup: 'Chest',
        equipment: 'Dumbbell',
        baseWeightKg: 20,
        baseReps: 10,
        coachCue: 'Pause briefly on the floor so every rep starts from control.',
      },
      {
        name: 'Standing Dumbbell Shoulder Press',
        muscleGroup: 'Shoulders',
        equipment: 'Dumbbell',
        baseWeightKg: 16,
        baseReps: 10,
        coachCue: 'Brace hard and press in a straight line overhead.',
      },
      {
        name: 'Bench Dip',
        muscleGroup: 'Triceps',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 14,
        coachCue: 'Keep shoulders down and use a smooth, full range.',
      },
    ],
    pull: [
      {
        name: 'One Arm Dumbbell Row',
        muscleGroup: 'Back',
        equipment: 'Dumbbell',
        baseWeightKg: 20,
        baseReps: 10,
        coachCue: 'Drive elbow to the hip and pause briefly at the top.',
      },
      {
        name: 'Dumbbell Romanian Deadlift',
        muscleGroup: 'Posterior Chain',
        equipment: 'Dumbbell',
        baseWeightKg: 24,
        baseReps: 10,
        coachCue: 'Keep the bells close and own the hinge through the hamstrings.',
      },
      {
        name: 'Hammer Curl',
        muscleGroup: 'Biceps',
        equipment: 'Dumbbell',
        baseWeightKg: 12,
        baseReps: 12,
        coachCue: 'Keep the elbows steady and squeeze the top.',
      },
      {
        name: 'Superman Hold',
        muscleGroup: 'Upper Back',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 15,
        coachCue: 'Lift with control and keep the neck long.',
      },
    ],
    legs: [
      {
        name: 'Goblet Squat',
        muscleGroup: 'Quads',
        equipment: 'Dumbbell',
        baseWeightKg: 24,
        baseReps: 10,
        coachCue: 'Stay tall and drive evenly through both feet.',
      },
      {
        name: 'Bulgarian Split Squat',
        muscleGroup: 'Legs',
        equipment: 'Dumbbell',
        baseWeightKg: 14,
        baseReps: 10,
        coachCue: 'Pause in the bottom and stay stacked over the front foot.',
      },
      {
        name: 'Dumbbell Romanian Deadlift',
        muscleGroup: 'Hamstrings',
        equipment: 'Dumbbell',
        baseWeightKg: 22,
        baseReps: 10,
        coachCue: 'Keep your hinge smooth and do not rush the turnaround.',
      },
      {
        name: 'Glute Bridge',
        muscleGroup: 'Glutes',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 15,
        coachCue: 'Lock out fully and pause at the top of every rep.',
      },
    ],
    'full body': [
      {
        name: 'Goblet Squat',
        muscleGroup: 'Legs',
        equipment: 'Dumbbell',
        baseWeightKg: 24,
        baseReps: 10,
        coachCue: 'Stay tall through the chest and keep every rep crisp.',
      },
      {
        name: 'Push-Up',
        muscleGroup: 'Chest',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 12,
        coachCue: 'Lock the body into one line and finish the press completely.',
      },
      {
        name: 'One Arm Dumbbell Row',
        muscleGroup: 'Back',
        equipment: 'Dumbbell',
        baseWeightKg: 20,
        baseReps: 10,
        coachCue: 'Pull elbow toward the hip and keep the torso quiet.',
      },
      {
        name: 'Glute Bridge',
        muscleGroup: 'Posterior Chain',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 15,
        coachCue: 'Squeeze hard at the top and control the lowering phase.',
      },
    ],
    upper: [
      {
        name: 'Push-Up',
        muscleGroup: 'Chest',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 12,
        coachCue: 'Keep the body rigid and own the full range.',
      },
      {
        name: 'One Arm Dumbbell Row',
        muscleGroup: 'Back',
        equipment: 'Dumbbell',
        baseWeightKg: 20,
        baseReps: 10,
        coachCue: 'Pull smoothly and pause the top of every rep.',
      },
      {
        name: 'Lateral Raise',
        muscleGroup: 'Shoulders',
        equipment: 'Dumbbell',
        baseWeightKg: 8,
        baseReps: 14,
        coachCue: 'Lead with elbows and stop before shrugging takes over.',
      },
      {
        name: 'Biceps Curl',
        muscleGroup: 'Biceps',
        equipment: 'Dumbbell',
        baseWeightKg: 10,
        baseReps: 12,
        coachCue: 'Stay strict and keep tension through the full arc.',
      },
    ],
    lower: [
      {
        name: 'Goblet Squat',
        muscleGroup: 'Quads',
        equipment: 'Dumbbell',
        baseWeightKg: 24,
        baseReps: 10,
        coachCue: 'Stay tall and drive evenly through both feet.',
      },
      {
        name: 'Hip Thrust',
        muscleGroup: 'Glutes',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 15,
        coachCue: 'Pause on top and keep the ribs down.',
      },
      {
        name: 'Reverse Lunge',
        muscleGroup: 'Legs',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 12,
        coachCue: 'Step back softly and stay balanced through the front foot.',
      },
      {
        name: 'Standing Calf Raise',
        muscleGroup: 'Calves',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 18,
        coachCue: 'Pause high and lower under control every time.',
      },
    ],
  },
  bodyweight: {
    push: [
      {
        name: 'Push-Up',
        muscleGroup: 'Chest',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 12,
        coachCue: 'Stay rigid through the trunk and press the floor away.',
      },
      {
        name: 'Decline Push-Up',
        muscleGroup: 'Upper Chest',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 10,
        coachCue: 'Keep your body in one line and control the descent.',
      },
      {
        name: 'Pike Push-Up',
        muscleGroup: 'Shoulders',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 10,
        coachCue: 'Shift weight forward and keep elbows tracking back.',
      },
      {
        name: 'Bench Dip',
        muscleGroup: 'Triceps',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 14,
        coachCue: 'Move smoothly and keep the shoulders packed.',
      },
    ],
    pull: [
      {
        name: 'Inverted Row',
        muscleGroup: 'Back',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 10,
        coachCue: 'Drive the chest to the bar or table edge with a tight body line.',
      },
      {
        name: 'Superman Hold',
        muscleGroup: 'Upper Back',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 15,
        coachCue: 'Lift smoothly and keep the neck relaxed.',
      },
      {
        name: 'Prone Y Raise',
        muscleGroup: 'Rear Delts',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 15,
        coachCue: 'Reach long and keep every rep controlled.',
      },
      {
        name: 'Reverse Snow Angel',
        muscleGroup: 'Upper Back',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 12,
        coachCue: 'Move slowly and keep tension through the upper back.',
      },
    ],
    legs: [
      {
        name: 'Air Squat',
        muscleGroup: 'Quads',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 16,
        coachCue: 'Stay tall and drive through the whole foot.',
      },
      {
        name: 'Reverse Lunge',
        muscleGroup: 'Legs',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 12,
        coachCue: 'Step back softly and own the bottom position.',
      },
      {
        name: 'Single Leg Glute Bridge',
        muscleGroup: 'Glutes',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 12,
        coachCue: 'Drive through the heel and keep hips level.',
      },
      {
        name: 'Standing Calf Raise',
        muscleGroup: 'Calves',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 18,
        coachCue: 'Pause high and control the lowering phase.',
      },
    ],
    'full body': [
      {
        name: 'Air Squat',
        muscleGroup: 'Legs',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 16,
        coachCue: 'Stay tall and keep each rep crisp.',
      },
      {
        name: 'Push-Up',
        muscleGroup: 'Chest',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 12,
        coachCue: 'Lock the body into one line and finish the press completely.',
      },
      {
        name: 'Inverted Row',
        muscleGroup: 'Back',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 10,
        coachCue: 'Pull the chest high and control the lowering phase.',
      },
      {
        name: 'Glute Bridge',
        muscleGroup: 'Posterior Chain',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 15,
        coachCue: 'Squeeze at the top and lower with intent.',
      },
    ],
    upper: [
      {
        name: 'Push-Up',
        muscleGroup: 'Chest',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 12,
        coachCue: 'Stay rigid through the trunk and press the floor away.',
      },
      {
        name: 'Inverted Row',
        muscleGroup: 'Back',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 10,
        coachCue: 'Drive the chest up without losing body tension.',
      },
      {
        name: 'Pike Push-Up',
        muscleGroup: 'Shoulders',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 10,
        coachCue: 'Shift forward, stay stacked, and press cleanly.',
      },
      {
        name: 'Plank Shoulder Tap',
        muscleGroup: 'Core',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 20,
        coachCue: 'Move slowly and fight hip rotation.',
      },
    ],
    lower: [
      {
        name: 'Air Squat',
        muscleGroup: 'Quads',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 16,
        coachCue: 'Stay tall and keep the tempo steady.',
      },
      {
        name: 'Walking Lunge',
        muscleGroup: 'Legs',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 12,
        coachCue: 'Take long controlled strides and keep the torso stacked.',
      },
      {
        name: 'Single Leg Glute Bridge',
        muscleGroup: 'Glutes',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 12,
        coachCue: 'Drive through the heel and hold the top position briefly.',
      },
      {
        name: 'Single Leg Calf Raise',
        muscleGroup: 'Calves',
        equipment: 'Bodyweight',
        baseWeightKg: 0,
        baseReps: 16,
        coachCue: 'Use full range and control both directions.',
      },
    ],
  },
};

export const WORKOUT_TRACKING_MODEL_TEMPLATE: WorkoutTrackingModel = {
  workout_id: 'uuid',
  date: 'ISO_date',
  exercises: [
    {
      name: 'Barbell Bench Press',
      sets: [
        { reps: 8, weight: 60 },
        { reps: 8, weight: 62.5 },
      ],
      completed: true,
    },
  ],
  duration_min: 45,
  performance_score: 0.95,
  prs: 1,
};

function createPlanId(splitKey: string): string {
  return `${splitKey}-${Date.now().toString(36)}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundWeight(value: number): number {
  if (value <= 0) {
    return 0;
  }
  return Math.round(value * 2) / 2;
}

export function getPerformance(workout: { totalSets: number; completedSets: number }): number {
  const total = workout.totalSets;
  const completed = workout.completedSets;

  if (!Number.isFinite(total) || total <= 0) {
    return 0;
  }
  if (!Number.isFinite(completed) || completed < 0) {
    return 0;
  }

  return completed / total;
}

function getPerformanceDecision(performance: number): {
  multiplier: number;
  progressionLabel: AdaptiveWorkoutPlan['progressionLabel'];
  cue: string;
  feedback: string;
} {
  const score = Number.isFinite(performance) ? performance : 0;

  if (score < 0.8) {
    return {
      multiplier: 0.95,
      progressionLabel: 'reload',
      cue: 'Reduce weight by 5% next workout',
      feedback: `Performance ${score.toFixed(2)}. Next workout reduces load so you can rebuild clean sets.`,
    };
  }

  if (score > 1) {
    return {
      multiplier: 1.025,
      progressionLabel: 'build',
      cue: 'Increase weight by 2.5% next workout',
      feedback: `Performance ${score.toFixed(2)}. Next workout increases load because you beat the planned volume.`,
    };
  }

  return {
    multiplier: 1,
    progressionLabel: 'hold',
    cue: 'Maintain current load next workout',
    feedback: `Performance ${score.toFixed(2)}. Next workout keeps load steady and asks for the same quality again.`,
  };
}

export function generateFeedback(performance: number): string {
  return getPerformanceDecision(performance).feedback;
}

export function applyProgression(lastWorkout: { totalSets: number; completedSets: number } | null): number {
  if (!lastWorkout) {
    return 1;
  }

  return getPerformanceDecision(getPerformance(lastWorkout)).multiplier;
}

export function getAICue(performance: number): string {
  return getPerformanceDecision(performance).cue;
}

function sentenceCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getCoachPrefix(settings: UserAppSettings): string {
  if (settings.ai_coach.style === 'strict') {
    return 'AI Coach';
  }
  if (settings.ai_coach.style === 'neutral') {
    return 'Coach Note';
  }
  return 'Coach Boost';
}

function getProgressionLabel(lastWorkout: LastWorkoutSummary | null): AdaptiveWorkoutPlan['progressionLabel'] {
  if (!lastWorkout) {
    return 'hold';
  }

  return getPerformanceDecision(lastWorkout.performance).progressionLabel;
}

function getProgressionMultiplier(label: AdaptiveWorkoutPlan['progressionLabel']): number {
  if (label === 'build') {
    return 1.025;
  }
  if (label === 'reload') {
    return 0.93;
  }
  return 1;
}

function pickNextSplit(settings: UserAppSettings, lastWorkout: LastWorkoutSummary | null): SplitKey {
  const rotation = TRAINING_SPLITS[settings.workout.training_type];
  if (!rotation.length) {
    return 'full body';
  }
  if (!lastWorkout) {
    return rotation[0];
  }
  const currentIndex = rotation.indexOf(lastWorkout.splitKey as SplitKey);
  return rotation[(currentIndex + 1 + rotation.length) % rotation.length];
}

function preferredExerciseCount(settings: UserAppSettings): number {
  if (settings.workout.session_duration_min <= 35) {
    return 3;
  }
  if (settings.workout.session_duration_min >= 55) {
    return 5;
  }
  return 4;
}

function getLastExerciseSummary(lastWorkout: LastWorkoutSummary | null, exerciseName: string): LastWorkoutExerciseSummary | null {
  if (!lastWorkout) {
    return null;
  }
  return (
    lastWorkout.exercises.find(
      (exercise) => exercise.name.trim().toLowerCase() === exerciseName.trim().toLowerCase()
    ) ?? null
  );
}

function normalizeWorkoutHistory(
  history: LastWorkoutSummary[],
  lastWorkout?: LastWorkoutSummary | null
): LastWorkoutSummary[] {
  const map = new Map<string, LastWorkoutSummary>();

  [lastWorkout ?? null, ...history].forEach((item) => {
    if (!item) {
      return;
    }

    const key = `${item.id}:${item.completedAt}`;
    if (!map.has(key)) {
      map.set(key, item);
    }
  });

  return [...map.values()].sort(
    (left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime()
  );
}

function getHistoricalExerciseBest(
  history: LastWorkoutSummary[],
  exerciseName: string
): LastWorkoutExerciseSummary | null {
  return history.reduce<LastWorkoutExerciseSummary | null>((best, workout) => {
    const current = getLastExerciseSummary(workout, exerciseName);

    if (!current) {
      return best;
    }
    if (!best) {
      return current;
    }
    if (current.topWeight > best.topWeight) {
      return current;
    }
    if (current.topWeight === best.topWeight && current.topReps > best.topReps) {
      return current;
    }
    return best;
  }, null);
}

function getRecentPerformanceScore(history: LastWorkoutSummary[], fallback: number): number {
  const recent = history.slice(0, 3).map((workout) => workout.performance).filter((value) => Number.isFinite(value));
  if (!recent.length) {
    return fallback;
  }

  const average = recent.reduce((sum, value) => sum + value, 0) / recent.length;
  return Number(average.toFixed(2));
}

function getWorkoutRecommendationAction(
  performanceScore: number,
  prs: number
): 'progress' | 'hold' | 'recover' {
  if (performanceScore < 0.78) {
    return 'recover';
  }
  if (prs > 0 || performanceScore >= 0.97) {
    return 'progress';
  }
  return 'hold';
}

function canUseExerciseAtHome(equipment: string): boolean {
  return equipment === 'Dumbbell' || equipment === 'Bodyweight';
}

function matchesEquipmentSetting(
  blueprint: ExerciseBlueprint,
  equipment: UserAppSettings['workout']['equipment']
): boolean {
  if (equipment === 'gym') {
    return true;
  }
  if (equipment === 'home') {
    return canUseExerciseAtHome(blueprint.equipment);
  }
  return blueprint.equipment === 'Bodyweight';
}

function getExerciseLibraryForEquipment(
  splitKey: SplitKey,
  equipment: UserAppSettings['workout']['equipment']
): ExerciseBlueprint[] {
  const baseLibrary = EXERCISE_LIBRARY[splitKey];

  if (equipment === 'gym') {
    return baseLibrary;
  }

  const filteredBase = baseLibrary.filter((exercise) => matchesEquipmentSetting(exercise, equipment));
  const fallbackLibrary = EQUIPMENT_FALLBACK_LIBRARY[equipment][splitKey];
  const combined = [...filteredBase, ...fallbackLibrary].filter(
    (exercise, index, list) => list.findIndex((item) => item.name === exercise.name) === index
  );

  return combined.length ? combined : baseLibrary;
}

function getPlanExerciseCount(settings: UserAppSettings, splitKey: SplitKey): number {
  const baseCount = preferredExerciseCount(settings);
  if (splitKey === 'full body' && baseCount < 4) {
    return 4;
  }
  return baseCount;
}

function getPlanRecommendation(
  settings: UserAppSettings,
  splitKey: SplitKey,
  progressionLabel: AdaptiveWorkoutPlan['progressionLabel'],
  lastWorkout: LastWorkoutSummary | null
): string {
  void progressionLabel;

  const performance = lastWorkout ? getPerformance(lastWorkout) : 1;
  return `${getCoachPrefix(settings)}: ${sentenceCase(generateFeedback(performance))} ${sentenceCase(splitKey)} is next.`;
}

function getInlineIntro(
  settings: UserAppSettings,
  progressionLabel: AdaptiveWorkoutPlan['progressionLabel'],
  performance: number
): string {
  void progressionLabel;

  return `${getCoachPrefix(settings)}: ${getAICue(performance)}.`;
}

function getRecoveryNote(
  settings: UserAppSettings,
  progressionLabel: AdaptiveWorkoutPlan['progressionLabel'],
  performance: number
): string {
  void progressionLabel;

  return `${getCoachPrefix(settings)} recovery note: ${generateFeedback(performance)}`;
}

export function generateWorkout(
  settings: UserAppSettings,
  options?: GenerateWorkoutOptions
): GeneratedWorkout;
export function generateWorkout(
  settings: UserAppSettings,
  lastWorkout: LastWorkoutSummary | null
): GeneratedWorkout;
export function generateWorkout(
  settings: UserAppSettings,
  lastWorkout: LastWorkoutSummary | null,
  splitType: PlannedSplitType
): GeneratedWorkout;
export function generateWorkout(
  settings: UserAppSettings,
  optionsOrLastWorkout: GenerateWorkoutOptions | LastWorkoutSummary | null = {},
  splitType?: PlannedSplitType
): GeneratedWorkout {
  const options: GenerateWorkoutOptions =
    splitType === undefined &&
    optionsOrLastWorkout &&
    typeof optionsOrLastWorkout === 'object' &&
    ('lastWorkout' in optionsOrLastWorkout || 'workoutHistory' in optionsOrLastWorkout)
      ? (optionsOrLastWorkout as GenerateWorkoutOptions)
      : { lastWorkout: optionsOrLastWorkout as LastWorkoutSummary | null };

  const rawHistory = options.workoutHistory ?? [];
  // Keep generation predictably fast by capping how much history we normalize.
  const cappedHistory = rawHistory.length > 30 ? rawHistory.slice(0, 30) : rawHistory;
  const history = normalizeWorkoutHistory(cappedHistory, options.lastWorkout);
  const lastWorkout = options.lastWorkout ?? history[0] ?? null;
  const splitKey =
    options.splitKeyOverride ?? (splitType ? toPlannedSplitKey(splitType) : pickNextSplit(settings, lastWorkout));
  const adaptiveEnabled = settings.ai_coach.enabled && settings.ai_coach.adaptive_training;
  const progressionEnabled = settings.ai_coach.enabled && settings.ai_coach.auto_progression;
  const progressionLabel = adaptiveEnabled ? getProgressionLabel(lastWorkout) : 'hold';
  const exerciseCount = getPlanExerciseCount(settings, splitKey);
  const levelMultiplier = LEVEL_MULTIPLIER[settings.profile.level];
  const repAdjustment = GOAL_REP_ADJUSTMENT[settings.profile.goal];
  const multiplier = progressionEnabled ? applyProgression(lastWorkout) : 1;
  const lastPerformance = lastWorkout ? getPerformance(lastWorkout) : 1;

  const exercises = getExerciseLibraryForEquipment(splitKey, settings.workout.equipment)
    .slice(0, exerciseCount)
    .map((exercise, index) => {
      const previous = getLastExerciseSummary(lastWorkout, exercise.name);
      const best = getHistoricalExerciseBest(history, exercise.name);
      const sets = index === 0 ? 4 : 3;
      const reps = Math.max(6, exercise.baseReps + repAdjustment + (progressionLabel === 'reload' ? -1 : 0));
      const baseWeight = previous?.topWeight ?? best?.topWeight ?? exercise.baseWeightKg * levelMultiplier;

      const progressedWeight = roundWeight(baseWeight * multiplier);

      return {
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        equipment: exercise.equipment,
        sets,
        reps,
        weightKg: progressedWeight,
        coachCue:
          best && best.topWeight > 0
            ? `${exercise.coachCue} Best logged: ${best.topWeight} kg for ${best.topReps} reps.`
            : exercise.coachCue,
      };
    });

  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  const summary = `${exercises.length} exercises, ${totalSets} working sets, target ${settings.workout.session_duration_min} min.`;

  return {
    id: createPlanId(splitKey),
    goal: settings.profile.goal,
    level: settings.profile.level,
    duration: settings.workout.session_duration_min,
    equipment: settings.workout.equipment,
    split: settings.workout.training_type,
    splitKey,
    title: SPLIT_TITLES[splitKey],
    summary,
    recommendation: getPlanRecommendation(settings, splitKey, progressionLabel, lastWorkout),
    inlineCoachIntro: getInlineIntro(settings, progressionLabel, lastPerformance),
    recoveryNote: getRecoveryNote(settings, progressionLabel, lastPerformance),
    estimatedDurationMin: settings.workout.session_duration_min,
    progressionLabel,
    exercises,
  };
}

export function buildAdaptiveWorkoutPlan(
  settings: UserAppSettings,
  lastWorkout: LastWorkoutSummary | null,
  workoutHistory: LastWorkoutSummary[] = []
): AdaptiveWorkoutPlan {
  const workout = generateWorkout(settings, {
    lastWorkout,
    workoutHistory,
  });

  return {
    id: workout.id,
    splitKey: workout.splitKey,
    title: workout.title,
    summary: workout.summary,
    recommendation: workout.recommendation,
    inlineCoachIntro: workout.inlineCoachIntro,
    recoveryNote: workout.recoveryNote,
    estimatedDurationMin: workout.estimatedDurationMin,
    progressionLabel: workout.progressionLabel,
    exercises: workout.exercises.map<GeneratedWorkoutExercise>((exercise) => ({
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
      targetSets: exercise.sets,
      targetReps: exercise.reps,
      targetWeightKg: exercise.weightKg,
      coachCue: exercise.coachCue,
    })),
  };
}

export function generatePlannedWorkouts(
  settings: UserAppSettings,
  lastWorkout: LastWorkoutSummary | null,
  daysAhead = 14
): PlannedWorkout[] {
  // Allow preview ranges from 7 days up to 60 days (1 week .. 2 months)
  const horizon = Math.max(7, Math.min(60, Math.floor(daysAhead)));
  const trainingDays = settings.workout.training_days;
  const planned: PlannedWorkout[] = [];

  let rotation: string[];
  if (settings.workout.training_type === 'push_pull_legs') {
    rotation = ['push', 'pull', 'legs'];
  } else if (settings.workout.training_type === 'split') {
    rotation = ['upper', 'lower'];
  } else if (settings.workout.training_type === 'custom') {
    const cleaned = Object.keys(settings.splitConfig.customColors ?? {}).map((routineName) => routineName.trim()).filter(Boolean);
    rotation = cleaned.length ? cleaned : ['Custom Session'];
  } else {
    rotation = ['full'];
  }

  let rotationIndex = 0;
  if (settings.workout.training_type === 'push_pull_legs' && lastWorkout?.splitKey) {
    const normalized = lastWorkout.splitKey.toLowerCase();
    const idx = rotation.findIndex((split) => split !== 'full' && split === normalized);
    rotationIndex = idx >= 0 ? (idx + 1) % rotation.length : 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = 0; offset < horizon; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const weekday = WEEKDAY_BY_INDEX[date.getDay()];
    if (!trainingDays.includes(weekday)) {
      continue;
    }

    const splitType = rotation[rotationIndex % rotation.length];
    rotationIndex += 1;

    const isoDate = toIsoDateOnly(date);
    const generationSplit: PlannedSplitType = settings.workout.training_type === 'custom' ? 'full' : (splitType as PlannedSplitType);
    const generated = generateWorkout(settings, lastWorkout, generationSplit);
    planned.push({
      date: isoDate,
      splitType,
      preview: toAdaptivePlanFromGenerated(generated, isoDate),
    });
  }

  return planned;
}

export function adjustForFatigue(performanceScore: number, settings: UserAppSettings): number {
  if (!settings.ai_coach.fatigue_adjustment) {
    return 1;
  }

  if (performanceScore < 0.78) {
    return 0.94;
  }
  if (performanceScore > 1.02) {
    return 1.03;
  }

  return 1;
}

export function generatePostWorkoutFeedback(workoutData: WorkoutSummaryInput, settings: UserAppSettings): string | null {
  if (!settings.ai_coach.post_workout_feedback) {
    return null;
  }

  const base = generateFeedback(workoutData.performance);

  if (!settings.ai_coach.enabled) {
    return base;
  }

  if (settings.ai_coach.style === 'strict') {
    return `Performance ${workoutData.performance.toFixed(2)}. ${base} Stay disciplined and hit every target rep next session.`;
  }

  if (settings.ai_coach.style === 'neutral') {
    return `Session complete. Score ${workoutData.performance.toFixed(2)}. ${base}`;
  }

  return `Great effort today. ${base} You logged ${workoutData.totalSets} planned sets and ${workoutData.prs} PRs.`;
}

export function shouldSendWorkoutReminder(today: string, settings: UserAppSettings): boolean {
  return (
    settings.notifications.workout_reminders.enabled &&
    settings.notifications.workout_reminders.days.includes(today as Weekday)
  );
}

export function findPlanExercise(
  plan: AdaptiveWorkoutPlan | null,
  exerciseName: string
): GeneratedWorkoutExercise | null {
  if (!plan) {
    return null;
  }
  return (
    plan.exercises.find((exercise) => exercise.name.trim().toLowerCase() === exerciseName.trim().toLowerCase()) ??
    null
  );
}

export function buildSetFeedback(
  exerciseName: string,
  weight: number,
  reps: number,
  previousSummary?: LastWorkoutSummary | null,
  workoutHistory: LastWorkoutSummary[] = []
): SetFeedbackSnapshot {
  const history = normalizeWorkoutHistory(workoutHistory, previousSummary);
  const previous = getHistoricalExerciseBest(history, exerciseName);

  if (!previous) {
    return {
      difference_weight: null,
      difference_reps: null,
      pr: weight > 0 || reps > 0,
    };
  }

  const differenceWeight = roundWeight(weight - previous.topWeight);
  const differenceReps = weight >= previous.topWeight ? reps - previous.topReps : reps;
  const pr = weight > previous.topWeight || (weight === previous.topWeight && reps > previous.topReps);

  return {
    difference_weight: differenceWeight,
    difference_reps: differenceReps,
    pr,
  };
}

export function buildSetSuggestion(input: BuildSetSuggestionInput): SetSuggestion {
  const targetWeight = input.planExercise?.targetWeightKg ?? input.weight;
  const targetReps = input.planExercise?.targetReps ?? Math.max(6, input.reps);
  const fatigueFailedSets = input.reps < targetReps - 1 ? 1 : 0;

  let action: SetSuggestion['action'] = 'hold';
  let trend: SetSuggestion['trend'] = 'flat';
  let result: SetSuggestion['result'] = 'success';
  let nextWeight = input.weight;
  let nextReps = targetReps;
  const adjustments: string[] = [];

  if (input.reps >= targetReps + 1) {
    action = 'increase';
    trend = 'up';
    nextWeight = roundWeight(Math.max(targetWeight, input.weight) * 1.025);
    adjustments.push('Execution was ahead of target, so the next set can climb slightly.');
  } else if (input.reps < Math.max(4, targetReps - 1)) {
    action = 'reduce';
    trend = 'down';
    result = 'fail';
    nextWeight = roundWeight(input.weight * 0.95);
    nextReps = Math.max(4, targetReps - 1);
    adjustments.push('Reps dropped below target, so tighten form and reduce load a touch.');
  } else {
    adjustments.push('Stay at the same load and repeat the quality on the next set.');
  }

  if (input.setNumber >= (input.planExercise?.targetSets ?? 3)) {
    adjustments.push('You have hit the planned working volume for this lift.');
  }

  return {
    next_weight_kg: nextWeight,
    next_reps: nextReps,
    result,
    trend,
    action,
    context: {
      workout_state: {
        workout_id: input.exerciseName,
        total_sets: input.totalWorkoutSets,
        exercise_sets: input.setNumber,
      },
      fatigue_failed_sets: fatigueFailedSets,
      consistency_score: input.reps >= targetReps ? 0.92 : input.reps >= targetReps - 1 ? 0.78 : 0.62,
      consistency: input.reps >= targetReps ? 'high' : input.reps >= targetReps - 1 ? 'medium' : 'low',
    },
    adjustments,
  };
}

export function buildInlineCoachMessage(input: InlineCoachInput): string | null {
  if (!input.plan) {
    return null;
  }

  if (!input.settings.ai_coach.enabled) {
    return input.plan.summary;
  }

  const performance = getPerformance({
    totalSets: input.totalPlannedSets,
    completedSets: input.completedSets,
  });

  if (input.latestSuggestion?.adjustments[0]) {
    return `${getAICue(performance)}. ${input.latestSuggestion.adjustments[0]}`;
  }

  return `${getAICue(performance)}. ${generateFeedback(performance)}`;
}

export function trimWorkoutHistory(
  history: LastWorkoutSummary[],
  settings: UserAppSettings
): LastWorkoutSummary[] {
  const normalized = normalizeWorkoutHistory(history);

  if (settings.tracking.history_limit === 'unlimited') {
    return normalized;
  }

  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return normalized.filter((workout) => {
    const completedAt = new Date(workout.completedAt).getTime();
    return Number.isFinite(completedAt) && completedAt >= cutoff;
  });
}

export function summarizeFinishedWorkout(input: FinishedWorkoutSummaryInput): LastWorkoutSummary {
  const exerciseSummaries: LastWorkoutExerciseSummary[] = input.exercises.map((exercise) => {
    const completedSets = exercise.sets.filter((setItem) => setItem.completed);
    const topSet = completedSets.reduce<{ weight: number; reps: number } | null>((best, setItem) => {
      if (!best) {
        return { weight: setItem.weight, reps: setItem.reps };
      }
      if (setItem.weight > best.weight || (setItem.weight === best.weight && setItem.reps > best.reps)) {
        return { weight: setItem.weight, reps: setItem.reps };
      }
      return best;
    }, null);

    return {
      name: exercise.name,
      sets: completedSets.length,
      topWeight: topSet?.weight ?? 0,
      topReps: topSet?.reps ?? 0,
    };
  });

  const completedSets = input.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.filter((setItem) => setItem.completed).length,
    0
  );
  const totalVolume = input.exercises.reduce(
    (sum, exercise) =>
      sum +
      exercise.sets
        .filter((setItem) => setItem.completed)
        .reduce((setSum, setItem) => setSum + setItem.weight * setItem.reps, 0),
    0
  );
  const durationMinutes = Math.max(1, Math.round(input.elapsedSeconds / 60));
  const plannedSets =
    input.plan?.exercises.reduce((sum, exercise) => sum + exercise.targetSets, 0) ??
    Math.max(1, input.exercises.length * 3);

  const performance = Number(
    getPerformance({
      totalSets: plannedSets,
      completedSets,
    }).toFixed(2)
  );
  const priorHistory = normalizeWorkoutHistory(input.history ?? [], input.previousSummary).filter(
    (workout) => workout.id !== input.workoutId
  );
  const prs = input.settings.tracking.track_prs
    ? exerciseSummaries.reduce((count, exercise) => {
        const previous = getHistoricalExerciseBest(priorHistory, exercise.name);
        if (!previous) {
          return count;
        }
        if (exercise.topWeight > previous.topWeight) {
          return count + 1;
        }
        if (exercise.topWeight === previous.topWeight && exercise.topReps > previous.topReps) {
          return count + 1;
        }
        return count;
      }, 0)
    : 0;

  const feedback = generatePostWorkoutFeedback(
    {
      performance,
      prs,
      totalSets: plannedSets,
      totalVolume,
      adherence: plannedSets > 0 ? completedSets / plannedSets : 0,
    },
    input.settings
  );

  return {
    id: input.workoutId,
    completedAt: input.completedAt,
    durationMinutes,
    totalVolume,
    totalSets: plannedSets,
    completedSets,
    performance,
    prs,
    splitKey: input.plan?.splitKey ?? 'full body',
    feedback,
    summaryLine: `${input.plan?.title ?? 'Workout'} completed in ${durationMinutes} min, score ${performance.toFixed(2)}, ${prs} PRs.`,
    exercises: exerciseSummaries,
  };
}
