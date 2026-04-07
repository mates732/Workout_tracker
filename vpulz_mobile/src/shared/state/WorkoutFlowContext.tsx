import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState as NativeAppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addExerciseToWorkout as addExerciseToWorkoutApi,
  type ConnectionConfig,
  type ExerciseItem,
  type ProgressResponse,
  type SetPatchPayload,
  type SetResponse,
  type SetSuggestion,
  type SetType,
  type WorkoutExerciseState,
  type WorkoutSession,
  type WorkoutState,
  finishWorkoutSession,
  getActiveWorkout,
  getExerciseProgress,
  getWorkoutState,
  logSet as logSetApi,
  searchExercises,
  updateSet as updateSetApi,
} from '../api/workoutApi';
import { searchInternetExerciseLibrary } from '../api/exerciseLibraryApi';
import {
  buildAdaptiveWorkoutPlan,
  buildSetFeedback,
  buildSetSuggestion,
  findPlanExercise,
  generatePlannedWorkouts,
  summarizeFinishedWorkout,
  trimWorkoutHistory,
  type AdaptiveWorkoutPlan,
  type LastWorkoutSummary,
  type PlannedWorkout,
} from './settingsLogic';
import {
  defaultUserAppSettings,
  loadUserAppSettings,
  saveUserAppSettings,
  type UserAppSettings,
} from './userAppSettingsStore';

const DEFAULT_CONNECTION: ConnectionConfig = {
  baseUrl: 'http://192.168.1.10:8000',
  token: 'dev-key',
  userId: 'u1',
};

type AddExercisePayload = {
  exercise_id?: number;
  exercise_name?: string;
  muscle_group?: string;
  equipment?: string;
};

type LogSetPayload = {
  workout_exercise_id?: string;
  exercise_id?: number;
  exercise_name?: string;
  weight: number;
  reps: number;
  rpe: number;
  duration: number;
  completed: boolean;
  set_type?: SetType;
};

export type WorkoutSessionState = {
  id: string;
  startTime: string;
  exercises: string[];
  isActive: boolean;
  minimized: boolean;
};

export type FinishedWorkoutResult = {
  workout: WorkoutSession;
  summary: LastWorkoutSummary;
  nextPlan: AdaptiveWorkoutPlan;
};

export type CurrentWorkout = {
  session: WorkoutSessionState;
  workout: WorkoutSession;
  state: WorkoutState;
  plan: AdaptiveWorkoutPlan;
  latestSetSuggestion: SetSuggestion | null;
};

export type TimerState = {
  elapsedSeconds: number;
  isRunning: boolean;
  isAppActive: boolean;
  isWorkoutScreenVisible: boolean;
  startedAt: string | null;
};

export type AppState = {
  settings: UserAppSettings;
  currentWorkout: CurrentWorkout | null;
  workoutHistory: LastWorkoutSummary[];
  plannedWorkouts: PlannedWorkout[];
  selectedDate: string;
};

type PersistedWorkoutState = {
  currentWorkout: CurrentWorkout | null;
  selectedDate?: string;
  elapsedSeconds?: number;
};

type LegacyPersistedWorkoutState = {
  session: WorkoutSessionState;
  activeWorkout: WorkoutSession | null;
  workoutState: WorkoutState | null;
  workoutPlan: AdaptiveWorkoutPlan | null;
  latestSetSuggestion: SetSuggestion | null;
};

type WorkoutFlowContextValue = {
  appState: AppState;
  connection: ConnectionConfig;
  setConnection: (next: ConnectionConfig) => void;
  selectedDate: string;
  setSelectedDate: (next: string) => void;
  settings: UserAppSettings;
  userProfile: UserAppSettings['profile'];
  aiCoachSettings: UserAppSettings['ai_coach'];
  updateSettings: (updater: (current: UserAppSettings) => UserAppSettings) => void;
  resetSettings: () => void;
  session: WorkoutSessionState;
  elapsedSeconds: number;
  timerState: TimerState;
  isInitializing: boolean;
  error: string | null;
  clearError: () => void;
  isWorkoutMinimized: boolean;
  setWorkoutScreenVisible: (visible: boolean) => void;
  minimizeWorkout: () => void;
  restoreWorkout: () => void;
  currentWorkout: CurrentWorkout | null;
  activeWorkout: WorkoutSession | null;
  workoutState: WorkoutState | null;
  workoutPlan: AdaptiveWorkoutPlan | null;
  workouts: PlannedWorkout[];
  plannedWorkouts: PlannedWorkout[];
  workoutHistory: LastWorkoutSummary[];
  lastWorkoutSummary: LastWorkoutSummary | null;
  latestSetSuggestion: SetSuggestion | null;
  refreshActiveWorkout: () => Promise<WorkoutSession | null>;
  refreshWorkoutState: () => Promise<WorkoutState | null>;
  setCurrentWorkout: (plan: AdaptiveWorkoutPlan) => WorkoutSession;
  startEmptyWorkout: () => WorkoutSession;
  startOrResumeWorkout: () => WorkoutSession;
  startPlannedWorkout: (planned: PlannedWorkout) => WorkoutSession;
  finishActiveWorkout: () => Promise<FinishedWorkoutResult>;
  /**
   * Complete the active workout using a minimal local result payload.
   * This updates workoutHistory, plannedWorkouts, clears currentWorkout and resets timers.
   */
  completeActiveWorkoutLocal: (payload: { date: string; exercises: WorkoutExerciseState[]; performance: number }) => void;
  /**
   * Reset the active workout immediately without saving history.
   * Clears `currentWorkout` and resets the elapsed timer to 0.
   */
  resetActiveWorkout: () => void;
  addExerciseToActiveWorkout: (payload: AddExercisePayload) => Promise<void>;
  logSetForActiveWorkout: (payload: LogSetPayload) => Promise<SetResponse>;
  patchSetLog: (setId: string, payload: SetPatchPayload) => Promise<SetResponse>;
  searchExerciseLibrary: (query?: string, muscleGroup?: string) => Promise<ExerciseItem[]>;
  loadExerciseProgress: (exerciseId: number) => Promise<ProgressResponse>;
};

const WorkoutFlowContext = createContext<WorkoutFlowContextValue | null>(null);

const SESSION_STORAGE_KEY = 'vpulz.workout.session.v4';
const LAST_WORKOUT_STORAGE_KEY = 'vpulz.workout.last-summary.v1';
const WORKOUT_HISTORY_STORAGE_KEY = 'vpulz.workout.history.v1';
const SELECTED_DATE_STORAGE_KEY = 'vpulz.workout.selected-date.v1';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function normalizeDateKey(value: string | null | undefined): string {
  if (!value || typeof value !== 'string') {
    return toDateKey(new Date());
  }

  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return toDateKey(new Date());
  }

  return toDateKey(parsed);
}

function createSessionId(): string {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `session-${Date.now()}-${randomPart}`;
}

function createInactiveSession(): WorkoutSessionState {
  return {
    id: createSessionId(),
    startTime: new Date().toISOString(),
    exercises: [],
    isActive: false,
    minimized: false,
  };
}

function createActiveSession(overrides?: Partial<WorkoutSessionState>): WorkoutSessionState {
  return {
    id: overrides?.id && overrides.id.trim() ? overrides.id : createSessionId(),
    startTime: overrides?.startTime && overrides.startTime.trim() ? overrides.startTime : new Date().toISOString(),
    exercises: Array.isArray(overrides?.exercises) ? overrides.exercises : [],
    isActive: true,
    minimized: Boolean(overrides?.minimized),
  };
}

function toElapsedSeconds(startTime: string): number {
  const start = new Date(startTime).getTime();
  if (!Number.isFinite(start)) {
    return 0;
  }

  return Math.max(0, Math.floor((Date.now() - start) / 1000));
}

function toLocalWorkoutSession(connection: ConnectionConfig, session: WorkoutSessionState): WorkoutSession {
  return {
    id: session.id,
    user_id: connection.userId,
    status: 'active',
    start_time: session.startTime,
    end_time: null,
  };
}

function requiredConnection(connection: ConnectionConfig): void {
  if (!connection.baseUrl.trim()) {
    throw new Error('Base URL is required');
  }
  if (!connection.token.trim()) {
    throw new Error('API token is required');
  }
  if (!connection.userId.trim()) {
    throw new Error('User ID is required');
  }
}

function messageFromUnknown(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Unexpected error';
}

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

function applyCoachSettingsToSuggestion(
  suggestion: SetSuggestion,
  settings: UserAppSettings,
  currentWeight: number,
  currentReps: number
): SetSuggestion {
  const coach = settings.ai_coach;

  if (!coach.enabled) {
    return {
      ...suggestion,
      next_weight_kg: currentWeight,
      next_reps: currentReps,
      action: 'hold',
      trend: 'flat',
      adjustments: ['Coach disabled. Logging only.'],
    };
  }

  let next: SetSuggestion = {
    ...suggestion,
    adjustments: [...suggestion.adjustments],
  };

  if (!coach.auto_progression) {
    next = {
      ...next,
      next_weight_kg: currentWeight,
      next_reps: currentReps,
      action: 'hold',
      trend: 'flat',
      adjustments: ['Progression disabled. Keep current load and repeat quality reps.'],
    };
  }

  if (coach.fatigue_adjustment && next.action === 'reduce') {
    next = {
      ...next,
      next_weight_kg: roundToHalf(Math.max(0, next.next_weight_kg * 0.97)),
      adjustments: ['Fatigue adjustment enabled. Dropping load a little extra for cleaner execution.', ...next.adjustments],
    };
  }

  const prefix = coach.style === 'strict' ? 'Strict:' : coach.style === 'neutral' ? 'Note:' : 'Coach:';

  return {
    ...next,
    adjustments: next.adjustments.map((message, index) => (index === 0 ? `${prefix} ${message}` : message)),
  };
}

function normalizeSessionFromWorkout(
  active: WorkoutSession | null,
  workout: WorkoutState | null,
  minimized: boolean
): WorkoutSessionState {
  if (!active) {
    return createInactiveSession();
  }

  return createActiveSession({
    id: active.id,
    startTime: active.start_time,
    exercises: workout?.exercises.map((item) => item.name) ?? [],
    minimized,
  });
}

function isWorkoutSession(value: unknown): value is WorkoutSession {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.user_id === 'string' &&
    typeof candidate.status === 'string' &&
    typeof candidate.start_time === 'string'
  );
}

function isWorkoutState(value: unknown): value is WorkoutState {
  if (!isWorkoutSession(value)) {
    return false;
  }

  const candidate = value as unknown as Record<string, unknown>;
  return Array.isArray(candidate.exercises);
}

function isAdaptiveWorkoutPlan(value: unknown): value is AdaptiveWorkoutPlan {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.splitKey === 'string' &&
    typeof candidate.title === 'string' &&
    Array.isArray(candidate.exercises)
  );
}

function isSetSuggestion(value: unknown): value is SetSuggestion {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.next_weight_kg === 'number' &&
    typeof candidate.next_reps === 'number' &&
    typeof candidate.action === 'string' &&
    typeof candidate.trend === 'string' &&
    Array.isArray(candidate.adjustments)
  );
}

function sanitizeSession(value: unknown): WorkoutSessionState | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<WorkoutSessionState>;
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.startTime !== 'string' ||
    !Array.isArray(candidate.exercises) ||
    typeof candidate.isActive !== 'boolean'
  ) {
    return null;
  }

  return {
    id: candidate.id,
    startTime: candidate.startTime,
    exercises: candidate.exercises.filter((item): item is string => typeof item === 'string'),
    isActive: candidate.isActive,
    minimized: Boolean(candidate.minimized),
  };
}

function sanitizeCurrentWorkout(value: unknown): CurrentWorkout | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const session = sanitizeSession(candidate.session);
  const workout = isWorkoutSession(candidate.workout) ? candidate.workout : null;
  const state = isWorkoutState(candidate.state) ? candidate.state : null;
  const plan = isAdaptiveWorkoutPlan(candidate.plan) ? candidate.plan : null;
  const latest =
    candidate.latestSetSuggestion == null || isSetSuggestion(candidate.latestSetSuggestion)
      ? (candidate.latestSetSuggestion as SetSuggestion | null)
      : null;

  if (!session || !session.isActive || !workout || !state || !plan) {
    return null;
  }

  return {
    session: {
      ...session,
      exercises: state.exercises.map((item) => item.name),
      isActive: true,
    },
    workout,
    state,
    plan,
    latestSetSuggestion: latest,
  };
}

function parsePersistedCurrentWorkout(raw: string): CurrentWorkout | null {
  try {
    const parsed = JSON.parse(raw) as PersistedWorkoutState | LegacyPersistedWorkoutState | CurrentWorkout;
    const direct = sanitizeCurrentWorkout((parsed as PersistedWorkoutState).currentWorkout ?? parsed);
    if (direct) {
      return direct;
    }

    const legacy = parsed as LegacyPersistedWorkoutState;
    const session = sanitizeSession(legacy.session);
    if (
      !session ||
      !session.isActive ||
      !legacy.activeWorkout ||
      !legacy.workoutState ||
      !legacy.workoutPlan ||
      !isWorkoutSession(legacy.activeWorkout) ||
      !isWorkoutState(legacy.workoutState) ||
      !isAdaptiveWorkoutPlan(legacy.workoutPlan)
    ) {
      return null;
    }

    return {
      session: {
        ...session,
        exercises: legacy.workoutState.exercises.map((item) => item.name),
        isActive: true,
      },
      workout: legacy.activeWorkout,
      state: legacy.workoutState,
      plan: legacy.workoutPlan,
      latestSetSuggestion:
        legacy.latestSetSuggestion && isSetSuggestion(legacy.latestSetSuggestion)
          ? legacy.latestSetSuggestion
          : null,
    };
  } catch {
    return null;
  }
}

function parsePersistedElapsedSeconds(raw: string): number | null {
  try {
    const parsed = JSON.parse(raw) as PersistedWorkoutState;
    const value = parsed.elapsedSeconds;
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return null;
    }

    return Math.max(0, Math.floor(value));
  } catch {
    return null;
  }
}

function sanitizeLastWorkoutSummary(value: unknown): LastWorkoutSummary | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const parsed = value as Partial<LastWorkoutSummary>;
  if (
    typeof parsed.id !== 'string' ||
    typeof parsed.completedAt !== 'string' ||
    typeof parsed.totalVolume !== 'number' ||
    typeof parsed.totalSets !== 'number' ||
    typeof parsed.performance !== 'number' ||
    !Array.isArray(parsed.exercises)
  ) {
    return null;
  }

  return {
    id: parsed.id,
    completedAt: parsed.completedAt,
    durationMinutes: typeof parsed.durationMinutes === 'number' ? parsed.durationMinutes : 0,
    totalVolume: parsed.totalVolume,
    totalSets: parsed.totalSets,
    completedSets: typeof parsed.completedSets === 'number' ? parsed.completedSets : parsed.totalSets,
    performance: parsed.performance,
    prs: typeof parsed.prs === 'number' ? parsed.prs : 0,
    splitKey: typeof parsed.splitKey === 'string' ? parsed.splitKey : 'full body',
    feedback: typeof parsed.feedback === 'string' || parsed.feedback === null ? parsed.feedback : null,
    summaryLine: typeof parsed.summaryLine === 'string' ? parsed.summaryLine : '',
    exercises: parsed.exercises
      .map((exercise) => {
        if (!exercise || typeof exercise !== 'object') {
          return null;
        }
        const candidate = exercise as Record<string, unknown>;
        if (
          typeof candidate.name !== 'string' ||
          typeof candidate.sets !== 'number' ||
          typeof candidate.topWeight !== 'number' ||
          typeof candidate.topReps !== 'number'
        ) {
          return null;
        }
        return {
          name: candidate.name,
          sets: candidate.sets,
          topWeight: candidate.topWeight,
          topReps: candidate.topReps,
        };
      })
      .filter((exercise): exercise is LastWorkoutSummary['exercises'][number] => exercise !== null),
  };
}

function parseLastWorkoutSummary(raw: string): LastWorkoutSummary | null {
  try {
    return sanitizeLastWorkoutSummary(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

function parseWorkoutHistory(raw: string): LastWorkoutSummary[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => sanitizeLastWorkoutSummary(item))
      .filter((item): item is LastWorkoutSummary => item !== null);
  } catch {
    return [];
  }
}

function createLocalExerciseId(): string {
  return `local-exercise-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createLocalSetId(): string {
  return `local-set-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createExerciseIdFallback(): number {
  return -Math.floor(Math.random() * 1000000) - 1;
}

function buildWorkoutStateFromPlan(workout: WorkoutSession, plan: AdaptiveWorkoutPlan): WorkoutState {
  return {
    ...workout,
    exercises: plan.exercises.map((exercise, index) => ({
      id: createLocalExerciseId(),
      workout_id: workout.id,
      exercise_id: createExerciseIdFallback(),
      name: exercise.name,
      muscle_group: exercise.muscleGroup,
      equipment: exercise.equipment,
      ordering: index,
      sets: [],
    })),
  };
}

function rebuildWorkoutStateForWorkout(workout: WorkoutSession, current: WorkoutState | null): WorkoutState | null {
  if (!current) {
    return null;
  }

  return {
    ...current,
    id: workout.id,
    user_id: workout.user_id,
    status: workout.status,
    start_time: workout.start_time,
    end_time: workout.end_time,
    exercises: current.exercises.map((exercise) => ({
      ...exercise,
      workout_id: workout.id,
      sets: exercise.sets.map((setItem) => ({
        ...setItem,
        workout_id: workout.id,
      })),
    })),
  };
}

function addExerciseToState(
  current: WorkoutState,
  workout: WorkoutSession,
  payload: AddExercisePayload
): WorkoutState {
  const exerciseName = payload.exercise_name?.trim() || `Exercise ${current.exercises.length + 1}`;
  const now = new Date().toISOString();
  const exerciseId = payload.exercise_id ?? createExerciseIdFallback();

  const exercise: WorkoutExerciseState = {
    id: createLocalExerciseId(),
    workout_id: workout.id,
    exercise_id: exerciseId,
    name: exerciseName,
    muscle_group: payload.muscle_group?.trim() || 'Custom',
    equipment: payload.equipment?.trim() || 'Mixed',
    ordering: current.exercises.length,
    sets: [
      {
        id: createLocalSetId(),
        workout_id: workout.id,
        workout_exercise_id: '',
        exercise_id: exerciseId,
        weight: 40,
        reps: 10,
        rpe: 8,
        duration: 60,
        completed: false,
        set_type: 'normal',
        volume: 40 * 10,
        created_at: now,
        updated_at: now,
      },
    ],
  };

  // Backfill the local set's workout_exercise_id now that we have the exercise id.
  const nextExercise: WorkoutExerciseState = {
    ...exercise,
    sets: exercise.sets.map((setItem) => ({
      ...setItem,
      workout_exercise_id: exercise.id,
      exercise_id: exercise.exercise_id,
    })),
  };

  return {
    ...current,
    exercises: [...current.exercises, nextExercise],
  };
}

function syncExerciseFromRemote(current: WorkoutState, remote: WorkoutExerciseState): WorkoutState {
  const remoteName = remote.name.trim().toLowerCase();

  const directIndex = current.exercises.findIndex((exercise) => exercise.id === remote.id);
  if (directIndex >= 0) {
    const local = current.exercises[directIndex];
    const nextExercises = [...current.exercises];
    nextExercises[directIndex] = {
      ...remote,
      sets: remote.sets.length ? remote.sets : local.sets,
    };
    return {
      ...current,
      exercises: nextExercises,
    };
  }

  // Prefer matching by ordering + name for local-first inserted exercises.
  const orderingIndex = current.exercises.findIndex(
    (exercise) => exercise.ordering === remote.ordering && exercise.name.trim().toLowerCase() === remoteName
  );

  if (orderingIndex >= 0) {
    const local = current.exercises[orderingIndex];
    const nextExercises = [...current.exercises];
    nextExercises[orderingIndex] = {
      ...remote,
      sets: local.sets.length ? local.sets : remote.sets,
    };
    return {
      ...current,
      exercises: nextExercises,
    };
  }

  return {
    ...current,
    exercises: [...current.exercises, remote].sort((left, right) => left.ordering - right.ordering),
  };
}

function upsertSetInState(
  current: WorkoutState,
  workout: WorkoutSession,
  exercise: WorkoutExerciseState,
  payload: LogSetPayload
): WorkoutState {
  const nextSet = {
    id: createLocalSetId(),
    workout_id: workout.id,
    workout_exercise_id: exercise.id,
    exercise_id: exercise.exercise_id,
    weight: payload.weight,
    reps: payload.reps,
    rpe: payload.rpe,
    duration: payload.duration,
    completed: payload.completed,
    set_type: payload.set_type ?? 'normal',
    volume: payload.weight * payload.reps,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    ...current,
    exercises: current.exercises.map((item) =>
      item.id === exercise.id
        ? {
            ...item,
            sets: [...item.sets, nextSet],
          }
        : item
    ),
  };
}

function patchSetInState(current: WorkoutState, setId: string, payload: SetPatchPayload): WorkoutState | null {
  let found = false;

  const next = {
    ...current,
    exercises: current.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((setItem) => {
        if (setItem.id !== setId) {
          return setItem;
        }

        found = true;
        const weight = payload.weight ?? setItem.weight;
        const reps = payload.reps ?? setItem.reps;

        return {
          ...setItem,
          ...payload,
          weight,
          reps,
          volume: weight * reps,
          updated_at: new Date().toISOString(),
        };
      }),
    })),
  };

  return found ? next : null;
}

function upsertExerciseInState(current: WorkoutState, exercise: WorkoutExerciseState): WorkoutState {
  const matchIndex = current.exercises.findIndex((item) => item.id === exercise.id);

  if (matchIndex >= 0) {
    const nextExercises = [...current.exercises];
    nextExercises[matchIndex] = exercise;
    return {
      ...current,
      exercises: nextExercises,
    };
  }

  return {
    ...current,
    exercises: [...current.exercises, exercise].sort((left, right) => left.ordering - right.ordering),
  };
}

function upsertLoggedSetInState(current: WorkoutState, setResponse: SetResponse): WorkoutState {
  const responseExerciseId = setResponse.exercise?.id;
  const responseExerciseNumericId = setResponse.exercise?.exercise_id;
  const responseSet = setResponse.set;

  return {
    ...current,
    exercises: current.exercises.map((exercise) => {
      const matchesExercise =
        (responseExerciseId && exercise.id === responseExerciseId) ||
        (typeof responseExerciseNumericId === 'number' && exercise.exercise_id === responseExerciseNumericId) ||
        exercise.id === responseSet.workout_exercise_id ||
        exercise.exercise_id === responseSet.exercise_id;

      if (!matchesExercise) {
        return exercise;
      }

      const existingIndex = exercise.sets.findIndex((setItem) => setItem.id === responseSet.id);
      if (existingIndex >= 0) {
        const nextSets = [...exercise.sets];
        nextSets[existingIndex] = responseSet;
        return {
          ...exercise,
          sets: nextSets,
        };
      }

      return {
        ...exercise,
        sets: [...exercise.sets, responseSet],
      };
    }),
  };
}

function findTargetExercise(workoutState: WorkoutState, payload: LogSetPayload): WorkoutExerciseState | null {
  if (payload.workout_exercise_id) {
    return workoutState.exercises.find((exercise) => exercise.id === payload.workout_exercise_id) ?? null;
  }

  if (typeof payload.exercise_id === 'number') {
    return workoutState.exercises.find((exercise) => exercise.exercise_id === payload.exercise_id) ?? null;
  }

  if (payload.exercise_name) {
    return (
      workoutState.exercises.find(
        (exercise) => exercise.name.trim().toLowerCase() === payload.exercise_name?.trim().toLowerCase()
      ) ?? null
    );
  }

  return null;
}

function countTotalSets(workoutState: WorkoutState): number {
  return workoutState.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.filter((setItem) => setItem.completed).length,
    0
  );
}

function syncSessionExerciseNames(currentWorkout: CurrentWorkout): CurrentWorkout {
  return {
    ...currentWorkout,
    session: {
      ...currentWorkout.session,
      exercises: currentWorkout.state.exercises.map((exercise) => exercise.name),
      isActive: true,
    },
  };
}

function createCurrentWorkoutFromPlan(
  connection: ConnectionConfig,
  plan: AdaptiveWorkoutPlan,
  preserved?: Partial<WorkoutSessionState>
): CurrentWorkout {
  const session = createActiveSession({
    id: preserved?.id,
    startTime: preserved?.startTime,
    minimized: preserved?.minimized,
    exercises: plan.exercises.map((exercise) => exercise.name),
  });
  const workout = toLocalWorkoutSession(connection, session);
  const state = buildWorkoutStateFromPlan(workout, plan);

  return {
    session: {
      ...session,
      exercises: state.exercises.map((exercise) => exercise.name),
      isActive: true,
    },
    workout,
    state,
    plan,
    latestSetSuggestion: null,
  };
}

function createEmptyWorkoutPlan(): AdaptiveWorkoutPlan {
  return {
    id: `manual-${Date.now()}`,
    splitKey: 'manual',
    title: 'New Workout',
    summary: 'Start by adding your first exercise.',
    recommendation: 'Build your session manually and track each set.',
    inlineCoachIntro: 'Add an exercise and begin logging sets.',
    recoveryNote: 'Stay consistent and keep form clean.',
    estimatedDurationMin: 45,
    progressionLabel: 'hold',
    exercises: [],
  };
}

function createCurrentWorkoutFromRemote(
  workout: WorkoutSession,
  state: WorkoutState,
  plan: AdaptiveWorkoutPlan,
  latestSetSuggestion: SetSuggestion | null,
  minimized: boolean
): CurrentWorkout {
  return {
    session: createActiveSession({
      id: workout.id,
      startTime: workout.start_time,
      minimized,
      exercises: state.exercises.map((exercise) => exercise.name),
    }),
    workout,
    state,
    plan,
    latestSetSuggestion,
  };
}

function createDefaultAppState(): AppState {
  return {
    settings: defaultUserAppSettings,
    currentWorkout: null,
    workoutHistory: [],
    plannedWorkouts: generatePlannedWorkouts(
      defaultUserAppSettings,
      null,
      defaultUserAppSettings.general.calendar_preview_days
    ),
    selectedDate: toDateKey(new Date()),
  };
}

export function WorkoutFlowProvider({ children }: PropsWithChildren) {
  const [connection, setConnectionState] = useState<ConnectionConfig>(DEFAULT_CONNECTION);
  const [appState, setAppState] = useState<AppState>(() => createDefaultAppState());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAppActive, setIsAppActive] = useState<boolean>(NativeAppState.currentState === 'active');
  const [isWorkoutScreenVisible, setIsWorkoutScreenVisibleState] = useState<boolean>(false);
  const appStateRef = useRef(appState);

  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  const settings = appState.settings;
  const currentWorkout = appState.currentWorkout;
  const workoutHistory = appState.workoutHistory;
  const plannedWorkouts = appState.plannedWorkouts;
  const selectedDate = appState.selectedDate;
  const userProfile = settings.profile;
  const aiCoachSettings = settings.ai_coach;
  const lastWorkoutSummary = workoutHistory[0] ?? null;
  const activeWorkout = currentWorkout?.workout ?? null;
  const workoutState = currentWorkout?.state ?? null;
  const latestSetSuggestion = currentWorkout?.latestSetSuggestion ?? null;

  const workoutPlan = useMemo<AdaptiveWorkoutPlan | null>(() => {
    if (currentWorkout) {
      return currentWorkout.plan;
    }

    return buildAdaptiveWorkoutPlan(settings, lastWorkoutSummary, workoutHistory);
  }, [currentWorkout, lastWorkoutSummary, settings, workoutHistory]);

  const session = useMemo<WorkoutSessionState>(() => {
    return currentWorkout?.session ?? createInactiveSession();
  }, [currentWorkout]);

  const setSelectedDate = useCallback((next: string) => {
    const normalized = normalizeDateKey(next);
    setAppState((current) => {
      if (current.selectedDate === normalized) {
        return current;
      }

      return {
        ...current,
        selectedDate: normalized,
      };
    });
  }, []);

  useEffect(() => {
    const subscription = NativeAppState.addEventListener('change', (nextState) => {
      setIsAppActive(nextState === 'active');
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Timer lifecycle: runs only with active workout while app is foregrounded.
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!currentWorkout) {
      setElapsedSeconds(0);
      return;
    }

    if (!isAppActive || !isWorkoutScreenVisible) {
      return;
    }

    const id = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    timerRef.current = id;

    return () => {
      if (timerRef.current != null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentWorkout?.session.id, isAppActive, isWorkoutScreenVisible]);

  useEffect(() => {
    if (!currentWorkout) {
      setElapsedSeconds(0);
      setIsWorkoutScreenVisibleState(false);
      return;
    }
  }, [currentWorkout?.session.id]);

  const setWorkoutScreenVisible = useCallback((visible: boolean) => {
    setIsWorkoutScreenVisibleState((current) => {
      if (current === visible) {
        return current;
      }

      return visible;
    });
  }, []);

  const timerState = useMemo<TimerState>(
    () => ({
      elapsedSeconds,
      isRunning: Boolean(currentWorkout) && isAppActive && isWorkoutScreenVisible,
      isAppActive,
      isWorkoutScreenVisible,
      startedAt: currentWorkout?.session.startTime ?? null,
    }),
    [currentWorkout, elapsedSeconds, isAppActive, isWorkoutScreenVisible]
  );

  const setConnection = useCallback((next: ConnectionConfig) => {
    setConnectionState({
      baseUrl: next.baseUrl.trim(),
      token: next.token.trim(),
      userId: next.userId.trim(),
    });
  }, []);

  const updateSettings = useCallback((updater: (current: UserAppSettings) => UserAppSettings) => {
    setAppState((current) => {
      const nextSettings = updater(current.settings);
      const nextHistory = trimWorkoutHistory(current.workoutHistory, nextSettings);
      void saveUserAppSettings(nextSettings).catch(() => undefined);

      return {
        settings: nextSettings,
        currentWorkout: current.currentWorkout,
        workoutHistory: nextHistory,
        plannedWorkouts: generatePlannedWorkouts(
          nextSettings,
          nextHistory[0] ?? null,
          nextSettings.general.calendar_preview_days
        ),
        selectedDate: current.selectedDate,
      };
    });
  }, []);

  const resetSettings = useCallback(() => {
    setAppState((current) => ({
      settings: defaultUserAppSettings,
      currentWorkout: current.currentWorkout,
      workoutHistory: trimWorkoutHistory(current.workoutHistory, defaultUserAppSettings),
      plannedWorkouts: generatePlannedWorkouts(
        defaultUserAppSettings,
        current.workoutHistory[0] ?? null,
        defaultUserAppSettings.general.calendar_preview_days
      ),
      selectedDate: current.selectedDate,
    }));
    void saveUserAppSettings(defaultUserAppSettings).catch(() => undefined);
  }, []);

  const runAction = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setError(null);
    try {
      return await fn();
    } catch (err: unknown) {
      setError(messageFromUnknown(err));
      throw err;
    }
  }, []);

  const refreshActiveWorkout = useCallback(async (): Promise<WorkoutSession | null> => {
    const snapshot = appStateRef.current;
    if (snapshot.currentWorkout) {
      return snapshot.currentWorkout.workout;
    }

    return runAction(async () => {
      try {
        requiredConnection(connection);
        const result = await getActiveWorkout(connection, connection.userId);
        if (!result.workout) {
          return null;
        }

        const plan = buildAdaptiveWorkoutPlan(snapshot.settings, snapshot.workoutHistory[0] ?? null, snapshot.workoutHistory);
        const remoteStateResult = await getWorkoutState(connection, result.workout.id).catch(() => null);
        const remoteState =
          remoteStateResult?.workout ??
          rebuildWorkoutStateForWorkout(result.workout, null) ??
          buildWorkoutStateFromPlan(result.workout, plan);
        const nextCurrentWorkout = createCurrentWorkoutFromRemote(result.workout, remoteState, plan, null, false);

        setAppState((current) => ({
          ...current,
          currentWorkout: nextCurrentWorkout,
        }));

        return result.workout;
      } catch {
        return null;
      }
    });
  }, [connection, runAction]);

  const refreshWorkoutState = useCallback(async (): Promise<WorkoutState | null> => {
    const snapshot = appStateRef.current;
    const current = snapshot.currentWorkout;
    if (!current) {
      return null;
    }

    return runAction(async () => {
      try {
        requiredConnection(connection);
        const result = await getWorkoutState(connection, current.workout.id);
        const nextCurrentWorkout = createCurrentWorkoutFromRemote(
          current.workout,
          result.workout,
          current.plan,
          current.latestSetSuggestion,
          current.session.minimized
        );

        setAppState((current) => ({
          ...current,
          currentWorkout: nextCurrentWorkout,
        }));

        return result.workout;
      } catch {
        return current.state;
      }
    });
  }, [connection, runAction]);

  const setCurrentWorkout = useCallback(
    (plan: AdaptiveWorkoutPlan): WorkoutSession => {
      setError(null);

      const snapshot = appStateRef.current;
      if (snapshot.currentWorkout) {
        const restored = syncSessionExerciseNames({
          ...snapshot.currentWorkout,
          session: {
            ...snapshot.currentWorkout.session,
            minimized: false,
            isActive: true,
          },
        });

        setAppState((current) => ({
          ...current,
          currentWorkout: restored,
        }));
        setIsWorkoutScreenVisibleState(true);

        return restored.workout;
      }

      const nextCurrentWorkout = createCurrentWorkoutFromPlan(connection, plan);
      setAppState((current) => ({
        ...current,
        currentWorkout: nextCurrentWorkout,
      }));
      setElapsedSeconds(0);
      setIsWorkoutScreenVisibleState(true);
      return nextCurrentWorkout.workout;
    },
    [connection]
  );

  const startOrResumeWorkout = useCallback((): WorkoutSession => {
    setError(null);

    const snapshot = appStateRef.current;
    if (snapshot.currentWorkout) {
      const restored = syncSessionExerciseNames({
        ...snapshot.currentWorkout,
        session: {
          ...snapshot.currentWorkout.session,
          minimized: false,
          isActive: true,
        },
      });

      setAppState((current) => ({
        ...current,
        currentWorkout: restored,
      }));
      setIsWorkoutScreenVisibleState(true);

      return restored.workout;
    }

    const plan = buildAdaptiveWorkoutPlan(snapshot.settings, snapshot.workoutHistory[0] ?? null, snapshot.workoutHistory);
    return setCurrentWorkout(plan);
  }, [setCurrentWorkout]);

  const startEmptyWorkout = useCallback((): WorkoutSession => {
    setError(null);

    const snapshot = appStateRef.current;
    if (snapshot.currentWorkout) {
      const restored = syncSessionExerciseNames({
        ...snapshot.currentWorkout,
        session: {
          ...snapshot.currentWorkout.session,
          minimized: false,
          isActive: true,
        },
      });

      setAppState((current) => ({
        ...current,
        currentWorkout: restored,
      }));
      setIsWorkoutScreenVisibleState(true);

      return restored.workout;
    }

    return setCurrentWorkout(createEmptyWorkoutPlan());
  }, [setCurrentWorkout]);

  const startPlannedWorkout = useCallback(
    (planned: PlannedWorkout): WorkoutSession => {
      if (appStateRef.current.currentWorkout) {
        return startOrResumeWorkout();
      }

      return setCurrentWorkout(planned.preview);
    },
    [setCurrentWorkout, startOrResumeWorkout]
  );

  const finishActiveWorkout = useCallback(async (): Promise<FinishedWorkoutResult> => {
    return runAction(async () => {
      const snapshot = appStateRef.current;
      const active = snapshot.currentWorkout;
      if (!active) {
        throw new Error('No active workout to finish');
      }

      const completedAt = new Date().toISOString();
      const summary = summarizeFinishedWorkout({
        workoutId: active.workout.id,
        completedAt,
        elapsedSeconds,
        exercises: active.state.exercises,
        plan: active.plan,
        previousSummary: snapshot.workoutHistory[0] ?? null,
        history: snapshot.workoutHistory,
        settings: snapshot.settings,
      });
      const nextHistory = trimWorkoutHistory(
        [
          summary,
          ...snapshot.workoutHistory.filter(
            (item) => item.id !== summary.id || item.completedAt !== summary.completedAt
          ),
        ],
        snapshot.settings
      );
      const nextPlan = buildAdaptiveWorkoutPlan(snapshot.settings, summary, nextHistory);
      const nextPlannedWorkouts = generatePlannedWorkouts(
        snapshot.settings,
        summary,
        snapshot.settings.general.calendar_preview_days
      );
      const finishedWorkout: WorkoutSession = {
        ...active.workout,
        status: 'finished',
        end_time: completedAt,
      };

      setAppState({
        settings: snapshot.settings,
        currentWorkout: null,
        workoutHistory: nextHistory,
        plannedWorkouts: nextPlannedWorkouts,
        selectedDate: snapshot.selectedDate,
      });
      setElapsedSeconds(0);
      setIsWorkoutScreenVisibleState(false);

      try {
        requiredConnection(connection);
        await finishWorkoutSession(connection, active.workout.id);
      } catch {
        // Local state is the source of truth for the in-app flow.
      }

      return {
        workout: finishedWorkout,
        summary,
        nextPlan,
      };
    });
  }, [connection, elapsedSeconds, runAction]);

  const completeActiveWorkoutLocal = useCallback(
    (payload: { date: string; exercises: WorkoutExerciseState[]; performance: number }) => {
      setError(null);

      const snapshot = appStateRef.current;
      const active = snapshot.currentWorkout;
      if (!active) {
        return;
      }

      const completedAt = payload.date;

      const exercisesSummary = active.state.exercises.map((ex) => {
        const sets = Array.isArray(ex.sets) ? ex.sets : [];
        const topWeight = sets.reduce((max, s) => Math.max(max, Number(s.weight || 0)), 0);
        const topReps = sets.reduce((max, s) => Math.max(max, Number(s.reps || 0)), 0);
        return {
          name: ex.name,
          sets: sets.length,
          topWeight,
          topReps,
        };
      });

      const totalSets = exercisesSummary.reduce((sum, e) => sum + e.sets, 0);
      const completedSets = active.state.exercises.reduce(
        (sum, ex) => sum + (ex.sets ? ex.sets.filter((s) => s.completed).length : 0),
        0
      );

      const totalVolume = active.state.exercises.reduce(
        (vol, ex) =>
          vol +
          (Array.isArray(ex.sets)
            ? ex.sets.reduce((svol, s) => svol + (Number(s.weight || 0) * Number(s.reps || 0)), 0)
            : 0),
        0
      );

      const summary = {
        id: `local-${Date.now()}`,
        completedAt,
        durationMinutes: Math.round(elapsedSeconds / 60),
        totalVolume,
        totalSets,
        completedSets,
        performance: payload.performance,
        prs: 0,
        splitKey: active.plan?.splitKey ?? 'full body',
        feedback: null,
        summaryLine: '',
        exercises: exercisesSummary,
      } as LastWorkoutSummary;

      const nextHistory = trimWorkoutHistory([summary, ...snapshot.workoutHistory], snapshot.settings);
      const nextPlannedWorkouts = generatePlannedWorkouts(snapshot.settings, summary, snapshot.settings.general.calendar_preview_days);

      setAppState({
        settings: snapshot.settings,
        currentWorkout: null,
        workoutHistory: nextHistory,
        plannedWorkouts: nextPlannedWorkouts,
        selectedDate: snapshot.selectedDate,
      });

      setElapsedSeconds(0);
      setIsWorkoutScreenVisibleState(false);
    },
    [elapsedSeconds]
  );

  const resetActiveWorkout = useCallback(() => {
    setError(null);
    const snapshot = appStateRef.current;
    // Clear current workout without saving any history
    setAppState({
      settings: snapshot.settings,
      currentWorkout: null,
      workoutHistory: snapshot.workoutHistory,
      plannedWorkouts: snapshot.plannedWorkouts,
      selectedDate: snapshot.selectedDate,
    });
    setElapsedSeconds(0);
    setIsWorkoutScreenVisibleState(false);
  }, []);

  const addExerciseToActiveWorkout = useCallback(
    async (payload: AddExercisePayload): Promise<void> => {
      await runAction(async () => {
        const snapshot = appStateRef.current;
        const baseCurrent =
          snapshot.currentWorkout ??
          createCurrentWorkoutFromPlan(
            connection,
            createEmptyWorkoutPlan()
          );
        const nextState = addExerciseToState(baseCurrent.state, baseCurrent.workout, payload);
        const nextName = payload.exercise_name?.trim();
        let nextCurrentWorkout = syncSessionExerciseNames({
          ...baseCurrent,
          state: nextState,
          plan:
            nextName
              ? {
                  ...baseCurrent.plan,
                  exercises: [
                    ...baseCurrent.plan.exercises,
                    {
                      name: nextName,
                      muscleGroup: payload.muscle_group?.trim() || 'Custom',
                      equipment: payload.equipment?.trim() || 'Mixed',
                      targetSets: 3,
                      targetReps: 10,
                      targetWeightKg: 20,
                      coachCue: 'Manual add. Start smooth, stay technical, and progress only if the reps stay clean.',
                    },
                  ],
                }
              : baseCurrent.plan,
          session: {
            ...baseCurrent.session,
            minimized: false,
            isActive: true,
          },
        });

        setAppState((current) => ({
          ...current,
          currentWorkout: nextCurrentWorkout,
        }));

        try {
          requiredConnection(connection);
          const remote = await addExerciseToWorkoutApi(connection, baseCurrent.workout.id, {
            exercise_id: payload.exercise_id,
            exercise_name: payload.exercise_name,
          });

          nextCurrentWorkout = syncSessionExerciseNames({
            ...nextCurrentWorkout,
            workout: remote.workout,
            state: syncExerciseFromRemote(nextCurrentWorkout.state, remote.exercise),
          });

          setAppState((current) => ({
            ...current,
            currentWorkout: nextCurrentWorkout,
          }));
        } catch {
          // Local-first add still succeeds when backend is unavailable.
        }
      });
    },
    [connection, runAction]
  );

  const logSetForActiveWorkout = useCallback(
    async (payload: LogSetPayload): Promise<SetResponse> => {
      return runAction(async () => {
        const snapshot = appStateRef.current;
        const active = snapshot.currentWorkout;
        if (!active) {
          throw new Error('No active workout');
        }

        const exercise = findTargetExercise(active.state, payload);
        if (!exercise) {
          throw new Error('Exercise not found');
        }

        const nextState = upsertSetInState(active.state, active.workout, exercise, payload);
        const updatedExercise = nextState.exercises.find((item) => item.id === exercise.id) ?? exercise;
        const feedback = buildSetFeedback(
          exercise.name,
          payload.weight,
          payload.reps,
          snapshot.workoutHistory[0] ?? null,
          snapshot.workoutHistory
        );
        const suggestion = applyCoachSettingsToSuggestion(
          buildSetSuggestion({
            exerciseName: exercise.name,
            setNumber: updatedExercise.sets.length,
            weight: payload.weight,
            reps: payload.reps,
            planExercise: findPlanExercise(active.plan, exercise.name),
            totalWorkoutSets: countTotalSets(nextState),
          }),
          snapshot.settings,
          payload.weight,
          payload.reps
        );

        let nextCurrentWorkout = syncSessionExerciseNames({
          ...active,
          state: nextState,
          latestSetSuggestion: suggestion,
        });

        setAppState((current) => ({
          ...current,
          currentWorkout: nextCurrentWorkout,
        }));

        const set = updatedExercise.sets[updatedExercise.sets.length - 1];

        try {
          requiredConnection(connection);
          const remote = await logSetApi(connection, {
            workout_id: active.workout.id,
            workout_exercise_id: payload.workout_exercise_id,
            exercise_id: payload.exercise_id,
            exercise_name: payload.exercise_name,
            weight: payload.weight,
            reps: payload.reps,
            rpe: payload.rpe,
            duration: payload.duration,
            completed: payload.completed,
          });

          const remoteSuggestion = applyCoachSettingsToSuggestion(
            remote.suggestion,
            snapshot.settings,
            payload.weight,
            payload.reps
          );

          nextCurrentWorkout = syncSessionExerciseNames({
            ...nextCurrentWorkout,
            state: upsertLoggedSetInState(nextCurrentWorkout.state, remote),
            latestSetSuggestion: remoteSuggestion,
          });

          setAppState((current) => ({
            ...current,
            currentWorkout: nextCurrentWorkout,
          }));

          return {
            ...remote,
            suggestion: remoteSuggestion,
          };
        } catch {
          // Local state remains authoritative.
        }

        return {
          set,
          feedback,
          suggestion,
          exercise: {
            id: exercise.id,
            exercise_id: exercise.exercise_id,
            name: exercise.name,
          },
          workout: active.workout,
        };
      });
    },
    [connection, runAction]
  );

  const patchSetLog = useCallback(
    async (setId: string, payload: SetPatchPayload): Promise<SetResponse> => {
      return runAction(async () => {
        const snapshot = appStateRef.current;
        const active = snapshot.currentWorkout;
        if (!active) {
          throw new Error('No active workout');
        }

        const nextState = patchSetInState(active.state, setId, payload);
        if (!nextState) {
          throw new Error('Set not found');
        }

        const exercise = nextState.exercises.find((item) => item.sets.some((setItem) => setItem.id === setId));
        const set = exercise?.sets.find((setItem) => setItem.id === setId);

        if (!exercise || !set) {
          throw new Error('Set not found');
        }

        const feedback = buildSetFeedback(
          exercise.name,
          set.weight,
          set.reps,
          snapshot.workoutHistory[0] ?? null,
          snapshot.workoutHistory
        );
        const suggestion = applyCoachSettingsToSuggestion(
          buildSetSuggestion({
            exerciseName: exercise.name,
            setNumber: exercise.sets.length,
            weight: set.weight,
            reps: set.reps,
            planExercise: findPlanExercise(active.plan, exercise.name),
            totalWorkoutSets: countTotalSets(nextState),
          }),
          snapshot.settings,
          set.weight,
          set.reps
        );

        let nextCurrentWorkout = syncSessionExerciseNames({
          ...active,
          state: nextState,
          latestSetSuggestion: suggestion,
        });

        setAppState((current) => ({
          ...current,
          currentWorkout: nextCurrentWorkout,
        }));

        try {
          requiredConnection(connection);
          const remote = await updateSetApi(connection, setId, payload);

          const remoteSuggestion = applyCoachSettingsToSuggestion(
            remote.suggestion,
            snapshot.settings,
            set.weight,
            set.reps
          );

          nextCurrentWorkout = syncSessionExerciseNames({
            ...nextCurrentWorkout,
            state: upsertLoggedSetInState(nextCurrentWorkout.state, remote),
            latestSetSuggestion: remoteSuggestion,
          });

          setAppState((current) => ({
            ...current,
            currentWorkout: nextCurrentWorkout,
          }));

          return {
            ...remote,
            suggestion: remoteSuggestion,
          };
        } catch {
          // Local state remains authoritative.
        }

        return {
          set,
          feedback,
          suggestion,
          exercise: {
            id: exercise.id,
            exercise_id: exercise.exercise_id,
            name: exercise.name,
          },
          workout: active.workout,
        };
      });
    },
    [connection, runAction]
  );

  const searchExerciseLibrary = useCallback(
    async (query?: string, muscleGroup?: string): Promise<ExerciseItem[]> => {
      return runAction(async () => {
        try {
          const internet = await searchInternetExerciseLibrary(query, muscleGroup, 30);
          if (internet.length > 0) {
            return internet;
          }
        } catch {
          // Fall back to the configured backend when the public library is unavailable.
        }

        try {
          const result = await searchExercises(connection, query, muscleGroup, 30);
          return result.exercises.map((item) => ({
            ...item,
            source: 'backend',
          }));
        } catch {
          return [];
        }
      });
    },
    [connection, runAction]
  );

  const loadExerciseProgress = useCallback(
    async (exerciseId: number): Promise<ProgressResponse> => {
      return runAction(async () => getExerciseProgress(connection, exerciseId, connection.userId));
    },
    [connection, runAction]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      setIsInitializing(true);
      try {
        const [persistedRaw, lastWorkoutRaw, workoutHistoryRaw, selectedDateRaw, storedSettings] = await Promise.all([
          AsyncStorage.getItem(SESSION_STORAGE_KEY),
          AsyncStorage.getItem(LAST_WORKOUT_STORAGE_KEY),
          AsyncStorage.getItem(WORKOUT_HISTORY_STORAGE_KEY),
          AsyncStorage.getItem(SELECTED_DATE_STORAGE_KEY),
          loadUserAppSettings(),
        ]);

        const persistedCurrentWorkout = persistedRaw ? parsePersistedCurrentWorkout(persistedRaw) : null;
        const persistedElapsedSeconds = persistedRaw ? parsePersistedElapsedSeconds(persistedRaw) : null;
        let selectedDateFromSession: string | null = null;
        if (persistedRaw) {
          try {
            const parsed = JSON.parse(persistedRaw) as { selectedDate?: unknown };
            if (typeof parsed.selectedDate === 'string') {
              selectedDateFromSession = normalizeDateKey(parsed.selectedDate);
            }
          } catch {
            selectedDateFromSession = null;
          }
        }
        const restoredSelectedDate = normalizeDateKey(selectedDateRaw ?? selectedDateFromSession);
        const lastSummary = lastWorkoutRaw ? parseLastWorkoutSummary(lastWorkoutRaw) : null;
        const historyFromStorage = workoutHistoryRaw ? parseWorkoutHistory(workoutHistoryRaw) : [];
        const initialHistory = trimWorkoutHistory(
          [
            ...historyFromStorage,
            ...(lastSummary &&
            !historyFromStorage.some(
              (item) => item.id === lastSummary.id && item.completedAt === lastSummary.completedAt
            )
              ? [lastSummary]
              : []),
          ],
          storedSettings
        );
        const latestSummary = initialHistory[0] ?? lastSummary;

        if (cancelled) {
          return;
        }

        setAppState((current) => ({
          settings: storedSettings,
          currentWorkout: current.currentWorkout ?? persistedCurrentWorkout,
          workoutHistory: current.workoutHistory.length ? current.workoutHistory : initialHistory,
          plannedWorkouts: generatePlannedWorkouts(
            storedSettings,
            (current.workoutHistory.length ? current.workoutHistory[0] : latestSummary) ?? null,
            storedSettings.general.calendar_preview_days
          ),
          selectedDate: restoredSelectedDate,
        }));

        if (persistedCurrentWorkout) {
          setElapsedSeconds(
            persistedElapsedSeconds ?? toElapsedSeconds(persistedCurrentWorkout.session.startTime)
          );
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (currentWorkout) {
      return;
    }

    setAppState((current) => ({
      ...current,
      plannedWorkouts: generatePlannedWorkouts(current.settings, current.workoutHistory[0] ?? null, 14),
    }));
  }, [currentWorkout, settings, workoutHistory]);

  useEffect(() => {
    if (!currentWorkout) {
      void AsyncStorage.removeItem(SESSION_STORAGE_KEY).catch(() => undefined);
      return;
    }

    const payload: PersistedWorkoutState = {
      currentWorkout,
      selectedDate,
      elapsedSeconds,
    };

    void AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload)).catch(() => undefined);
  }, [currentWorkout, elapsedSeconds, selectedDate]);

  useEffect(() => {
    void AsyncStorage.setItem(SELECTED_DATE_STORAGE_KEY, selectedDate).catch(() => undefined);
  }, [selectedDate]);

  useEffect(() => {
    if (!workoutHistory.length) {
      void Promise.all([
        AsyncStorage.removeItem(WORKOUT_HISTORY_STORAGE_KEY),
        AsyncStorage.removeItem(LAST_WORKOUT_STORAGE_KEY),
      ]).catch(() => undefined);
      return;
    }

    void Promise.all([
      AsyncStorage.setItem(WORKOUT_HISTORY_STORAGE_KEY, JSON.stringify(workoutHistory)),
      AsyncStorage.setItem(LAST_WORKOUT_STORAGE_KEY, JSON.stringify(workoutHistory[0])),
    ]).catch(() => undefined);
  }, [workoutHistory]);

  const minimizeWorkout = useCallback(() => {
    setIsWorkoutScreenVisibleState(false);
    setAppState((current) => {
      if (!current.currentWorkout || current.currentWorkout.session.minimized) {
        return current;
      }

      return {
        ...current,
        currentWorkout: {
          ...current.currentWorkout,
          session: {
            ...current.currentWorkout.session,
            minimized: true,
          },
        },
      };
    });
  }, []);

  const restoreWorkout = useCallback(() => {
    setIsWorkoutScreenVisibleState(true);
    setAppState((current) => {
      if (!current.currentWorkout || !current.currentWorkout.session.minimized) {
        return current;
      }

      return {
        ...current,
        currentWorkout: {
          ...current.currentWorkout,
          session: {
            ...current.currentWorkout.session,
            minimized: false,
          },
        },
      };
    });
  }, []);

  const value = useMemo<WorkoutFlowContextValue>(
    () => ({
      appState,
      connection,
      setConnection,
      selectedDate,
      setSelectedDate,
      settings,
      userProfile,
      aiCoachSettings,
      updateSettings,
      resetSettings,
      session,
      elapsedSeconds,
      timerState,
      isInitializing,
      error,
      clearError,
      isWorkoutMinimized: Boolean(currentWorkout?.session.minimized),
      setWorkoutScreenVisible,
      minimizeWorkout,
      restoreWorkout,
      currentWorkout,
      activeWorkout,
      workoutState,
      workoutPlan,
      workouts: plannedWorkouts,
      plannedWorkouts,
      workoutHistory,
      lastWorkoutSummary,
      latestSetSuggestion,
      refreshActiveWorkout,
      refreshWorkoutState,
      setCurrentWorkout,
      completeActiveWorkoutLocal,
      startEmptyWorkout,
      startOrResumeWorkout,
      startPlannedWorkout,
      finishActiveWorkout,
      resetActiveWorkout,
      addExerciseToActiveWorkout,
      logSetForActiveWorkout,
      patchSetLog,
      searchExerciseLibrary,
      loadExerciseProgress,
    }),
    [
      activeWorkout,
      addExerciseToActiveWorkout,
      appState,
      clearError,
      connection,
      currentWorkout,
      elapsedSeconds,
      error,
      finishActiveWorkout,
      isInitializing,
      isAppActive,
      completeActiveWorkoutLocal,
      lastWorkoutSummary,
      latestSetSuggestion,
      loadExerciseProgress,
      logSetForActiveWorkout,
      minimizeWorkout,
      patchSetLog,
      plannedWorkouts,
      refreshActiveWorkout,
      refreshWorkoutState,
      resetActiveWorkout,
      resetSettings,
      selectedDate,
      setSelectedDate,
      setWorkoutScreenVisible,
      setCurrentWorkout,
      restoreWorkout,
      searchExerciseLibrary,
      session,
      setConnection,
      settings,
      timerState,
      userProfile,
      aiCoachSettings,
      startEmptyWorkout,
      startPlannedWorkout,
      startOrResumeWorkout,
      updateSettings,
      workoutHistory,
      workoutPlan,
      workoutState,
    ]
  );

  return <WorkoutFlowContext.Provider value={value}>{children}</WorkoutFlowContext.Provider>;
}

export function useWorkoutFlow(): WorkoutFlowContextValue {
  const context = useContext(WorkoutFlowContext);
  if (!context) {
    throw new Error('useWorkoutFlow must be used inside WorkoutFlowProvider');
  }
  return context;
}
