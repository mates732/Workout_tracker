export type TrackerScreenState = 'start' | 'active' | 'summary';

export type WorkoutStartMode = 'empty' | 'plan' | 'resume';

export type WorkoutSessionState = {
  id: string;
  startTime: string;
  exercises: Array<{
    id: string;
    name: string;
  }>;
  isActive: boolean;
};

export type WorkoutSetLog = {
  id: string;
  weight: number;
  reps: number;
  rpe?: number;
  note?: string;
  timestamp: string;
};

export type WorkoutExerciseLog = {
  id: string;
  name: string;
  muscle_group: string;
  note?: string;
  supersetGroupId?: string;
  sets: WorkoutSetLog[];
};

export type WorkoutLog = {
  id: string;
  date: string;
  duration: number;
  note?: string;
  exercises: WorkoutExerciseLog[];
};

export type WorkoutHistoryEntry = {
  workoutId: string;
  date: string;
  durationMinutes: number;
  totalVolume: number;
  totalSets: number;
  personalRecord?: string | null;
  insight?: string | null;
};

export type PendingActionType =
  | 'log_set'
  | 'patch_set'
  | 'add_exercise'
  | 'finish_workout'
  | 'create_superset'
  | 'reorder_exercises';

export type PendingAction = {
  id: string;
  workoutId: string;
  type: PendingActionType;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type WorkoutDraftSet = {
  weight: string;
  reps: string;
  rpe?: string;
  note?: string;
};

export type WorkoutDraftExercise = {
  exerciseId: string;
  nextSet: WorkoutDraftSet;
  hiddenSetIds: string[];
  supersetGroupId?: string;
  note?: string;
};

export type WorkoutDraft = {
  workoutId: string;
  updatedAt: string;
  exerciseOrder: string[];
  exercises: Record<string, WorkoutDraftExercise>;
  setNotes: Record<string, string>;
  workoutNote?: string;
  restTimerSeconds: number;
  restTimerEndsAt?: string;
};

export type TrackerSessionSnapshot = {
  activeWorkoutId?: string;
  drafts: Record<string, WorkoutDraft>;
  pendingQueue: PendingAction[];
  favorites: number[];
  recentExerciseIds: number[];
  workoutHistory: WorkoutHistoryEntry[];
};
