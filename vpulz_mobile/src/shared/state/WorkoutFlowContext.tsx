import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  type ConnectionConfig,
  type ExerciseItem,
  type ProgressResponse,
  type SetPatchPayload,
  type SetResponse,
  type WorkoutSession,
  type WorkoutState,
  addExerciseToWorkout,
  finishWorkoutSession,
  getActiveWorkout,
  getExerciseProgress,
  getWorkoutState,
  logSet,
  searchExercises,
  startWorkoutSession,
  updateSet,
} from '../api/workoutApi';

const DEFAULT_CONNECTION: ConnectionConfig = {
  baseUrl: 'http://192.168.1.10:8000',
  token: 'dev-key',
  userId: 'u1',
};

type AddExercisePayload = {
  exercise_id?: number;
  exercise_name?: string;
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
};

type WorkoutFlowContextValue = {
  connection: ConnectionConfig;
  setConnection: (next: ConnectionConfig) => void;
  busy: boolean;
  error: string | null;
  clearError: () => void;
  activeWorkout: WorkoutSession | null;
  workoutState: WorkoutState | null;
  refreshActiveWorkout: () => Promise<WorkoutSession | null>;
  refreshWorkoutState: () => Promise<WorkoutState | null>;
  startOrResumeWorkout: () => Promise<WorkoutSession>;
  finishActiveWorkout: () => Promise<WorkoutSession>;
  addExerciseToActiveWorkout: (payload: AddExercisePayload) => Promise<void>;
  logSetForActiveWorkout: (payload: LogSetPayload) => Promise<SetResponse>;
  patchSetLog: (setId: string, payload: SetPatchPayload) => Promise<SetResponse>;
  searchExerciseLibrary: (query?: string, muscleGroup?: string) => Promise<ExerciseItem[]>;
  loadExerciseProgress: (exerciseId: number) => Promise<ProgressResponse>;
};

const WorkoutFlowContext = createContext<WorkoutFlowContextValue | null>(null);

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

export function WorkoutFlowProvider({ children }: PropsWithChildren) {
  const [connection, setConnectionState] = useState<ConnectionConfig>(DEFAULT_CONNECTION);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);
  const [workoutState, setWorkoutState] = useState<WorkoutState | null>(null);

  const setConnection = useCallback((next: ConnectionConfig) => {
    setConnectionState({
      baseUrl: next.baseUrl.trim(),
      token: next.token.trim(),
      userId: next.userId.trim(),
    });
  }, []);

  const runAction = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (err: unknown) {
      const message = messageFromUnknown(err);
      setError(message);
      throw err;
    } finally {
      setBusy(false);
    }
  }, []);

  const fetchWorkoutState = useCallback(
    async (workoutId: string): Promise<WorkoutState> => {
      const result = await getWorkoutState(connection, workoutId);
      setWorkoutState(result.workout);
      return result.workout;
    },
    [connection]
  );

  const refreshActiveWorkout = useCallback(async (): Promise<WorkoutSession | null> => {
    return runAction(async () => {
      requiredConnection(connection);
      const result = await getActiveWorkout(connection, connection.userId);
      setActiveWorkout(result.workout);

      if (!result.workout) {
        setWorkoutState(null);
        return null;
      }

      await fetchWorkoutState(result.workout.id);
      return result.workout;
    });
  }, [connection, fetchWorkoutState, runAction]);

  const refreshWorkoutState = useCallback(async (): Promise<WorkoutState | null> => {
    return runAction(async () => {
      if (!activeWorkout) {
        setWorkoutState(null);
        return null;
      }

      return fetchWorkoutState(activeWorkout.id);
    });
  }, [activeWorkout, fetchWorkoutState, runAction]);

  const startOrResumeWorkout = useCallback(async (): Promise<WorkoutSession> => {
    return runAction(async () => {
      requiredConnection(connection);
      const started = await startWorkoutSession(connection, connection.userId);
      setActiveWorkout(started.workout);
      await fetchWorkoutState(started.workout.id);
      return started.workout;
    });
  }, [connection, fetchWorkoutState, runAction]);

  const finishActiveWorkout = useCallback(async (): Promise<WorkoutSession> => {
    return runAction(async () => {
      if (!activeWorkout) {
        throw new Error('No active workout to finish');
      }

      const finished = await finishWorkoutSession(connection, activeWorkout.id);
      setActiveWorkout(null);
      setWorkoutState(null);
      return finished.workout;
    });
  }, [activeWorkout, connection, runAction]);

  const addExerciseToActiveWorkout = useCallback(
    async (payload: AddExercisePayload): Promise<void> => {
      await runAction(async () => {
        let targetWorkout = activeWorkout;
        if (!targetWorkout) {
          requiredConnection(connection);
          const started = await startWorkoutSession(connection, connection.userId);
          targetWorkout = started.workout;
          setActiveWorkout(started.workout);
        }

        await addExerciseToWorkout(connection, targetWorkout.id, payload);
        await fetchWorkoutState(targetWorkout.id);
      });
    },
    [activeWorkout, connection, fetchWorkoutState, runAction]
  );

  const logSetForActiveWorkout = useCallback(
    async (payload: LogSetPayload): Promise<SetResponse> => {
      return runAction(async () => {
        const workoutId = activeWorkout?.id;
        if (!workoutId) {
          throw new Error('No active workout');
        }

        const result = await logSet(connection, {
          workout_id: workoutId,
          ...payload,
        });
        await fetchWorkoutState(workoutId);
        return result;
      });
    },
    [activeWorkout, connection, fetchWorkoutState, runAction]
  );

  const patchSetLog = useCallback(
    async (setId: string, payload: SetPatchPayload): Promise<SetResponse> => {
      return runAction(async () => {
        const result = await updateSet(connection, setId, payload);
        if (activeWorkout) {
          await fetchWorkoutState(activeWorkout.id);
        }
        return result;
      });
    },
    [activeWorkout, connection, fetchWorkoutState, runAction]
  );

  const searchExerciseLibrary = useCallback(
    async (query?: string, muscleGroup?: string): Promise<ExerciseItem[]> => {
      return runAction(async () => {
        const result = await searchExercises(connection, query, muscleGroup, 30);
        return result.exercises;
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
    void refreshActiveWorkout().catch(() => undefined);
  }, [refreshActiveWorkout]);

  const value = useMemo<WorkoutFlowContextValue>(
    () => ({
      connection,
      setConnection,
      busy,
      error,
      clearError,
      activeWorkout,
      workoutState,
      refreshActiveWorkout,
      refreshWorkoutState,
      startOrResumeWorkout,
      finishActiveWorkout,
      addExerciseToActiveWorkout,
      logSetForActiveWorkout,
      patchSetLog,
      searchExerciseLibrary,
      loadExerciseProgress,
    }),
    [
      connection,
      setConnection,
      busy,
      error,
      clearError,
      activeWorkout,
      workoutState,
      refreshActiveWorkout,
      refreshWorkoutState,
      startOrResumeWorkout,
      finishActiveWorkout,
      addExerciseToActiveWorkout,
      logSetForActiveWorkout,
      patchSetLog,
      searchExerciseLibrary,
      loadExerciseProgress,
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
