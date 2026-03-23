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
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { searchInternetExerciseLibrary } from '../api/exerciseLibraryApi';

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

export type WorkoutSessionState = {
  id: string;
  startTime: string;
  exercises: string[];
  isActive: boolean;
  minimized: boolean;
};

type PersistedWorkoutSessionState = Pick<
  WorkoutSessionState,
  'id' | 'startTime' | 'exercises' | 'isActive' | 'minimized'
>;

const SESSION_STORAGE_KEY = 'vpulz.workout.session.v1';

type WorkoutFlowContextValue = {
  connection: ConnectionConfig;
  setConnection: (next: ConnectionConfig) => void;
  session: WorkoutSessionState;
  elapsedSeconds: number;
  busy: boolean;
  isInitializing: boolean;
  error: string | null;
  clearError: () => void;
  isWorkoutMinimized: boolean;
  minimizeWorkout: () => void;
  restoreWorkout: () => void;
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

function normalizeSessionFromWorkout(
  active: WorkoutSession | null,
  workout: WorkoutState | null,
  minimized: boolean
): WorkoutSessionState {
  if (!active) {
    return createInactiveSession();
  }

  const exercises = workout?.exercises.map((item) => item.name) ?? [];
  return createActiveSession({
    id: active.id,
    startTime: active.start_time,
    exercises,
    minimized,
  });
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

function parsePersistedSession(raw: string): WorkoutSessionState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedWorkoutSessionState>;
    const id = typeof parsed.id === 'string' ? parsed.id.trim() : '';
    const startTime = typeof parsed.startTime === 'string' ? parsed.startTime.trim() : '';
    const exercises = Array.isArray(parsed.exercises)
      ? parsed.exercises.filter((item): item is string => typeof item === 'string')
      : [];
    const isActive = Boolean(parsed.isActive);
    const minimized = Boolean(parsed.minimized);

    if (!id || !startTime || !isActive) {
      return null;
    }

    return createActiveSession({
      id,
      startTime,
      exercises,
      minimized,
    });
  } catch {
    return null;
  }
}

export function WorkoutFlowProvider({ children }: PropsWithChildren) {
  const [connection, setConnectionState] = useState<ConnectionConfig>(DEFAULT_CONNECTION);
  const [session, setSession] = useState<WorkoutSessionState>(() => createInactiveSession());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);
  const [workoutState, setWorkoutState] = useState<WorkoutState | null>(null);
  const startResumePromiseRef = useRef<Promise<WorkoutSession> | null>(null);

  const busy = pendingCount > 0;

  const setConnection = useCallback((next: ConnectionConfig) => {
    setConnectionState({
      baseUrl: next.baseUrl.trim(),
      token: next.token.trim(),
      userId: next.userId.trim(),
    });
  }, []);

  const runAction = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setPendingCount((current) => current + 1);
    setError(null);
    try {
      return await fn();
    } catch (err: unknown) {
      const message = messageFromUnknown(err);
      setError(message);
      throw err;
    } finally {
      setPendingCount((current) => Math.max(0, current - 1));
    }
  }, []);

  const fetchWorkoutStateInternal = useCallback(
    async (workoutId: string): Promise<WorkoutState> => {
      const result = await getWorkoutState(connection, workoutId);
      setWorkoutState(result.workout);
      setSession((current) => {
        if (!current.isActive || current.id !== result.workout.id) {
          return current;
        }

        const nextExercises = result.workout.exercises.map((item) => item.name);
        const sameExercises =
          current.exercises.length === nextExercises.length &&
          current.exercises.every((value, index) => value === nextExercises[index]);

        if (sameExercises) {
          return current;
        }

        return {
          ...current,
          exercises: nextExercises,
        };
      });
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
        setSession(createInactiveSession());
        return null;
      }

      const details = await fetchWorkoutStateInternal(result.workout.id);
      setSession((current) => normalizeSessionFromWorkout(result.workout, details, current.minimized));
      return result.workout;
    });
  }, [connection, fetchWorkoutStateInternal, runAction]);

  const refreshWorkoutState = useCallback(async (): Promise<WorkoutState | null> => {
    return runAction(async () => {
      if (!activeWorkout) {
        setWorkoutState(null);
        return null;
      }

      return fetchWorkoutStateInternal(activeWorkout.id);
    });
  }, [activeWorkout, fetchWorkoutStateInternal, runAction]);

  const startOrResumeWorkout = useCallback(async (): Promise<WorkoutSession> => {
    if (startResumePromiseRef.current) {
      return startResumePromiseRef.current;
    }

    const promise = runAction(async () => {
      if (activeWorkout) {
        setSession((current) => (current.minimized ? { ...current, minimized: false } : current));
        return activeWorkout;
      }

      if (session.isActive) {
        try {
          const restored = await fetchWorkoutStateInternal(session.id);
          setActiveWorkout(restored);
          setSession((current) => ({
            ...normalizeSessionFromWorkout(restored, restored, current.minimized),
            minimized: false,
          }));
          return restored;
        } catch {
          const localWorkout = toLocalWorkoutSession(connection, session);
          setActiveWorkout(localWorkout);
          return localWorkout;
        }
      }

      requiredConnection(connection);
      try {
        const started = await startWorkoutSession(connection, connection.userId);
        setActiveWorkout(started.workout);
        await fetchWorkoutStateInternal(started.workout.id);
        setSession(
          createActiveSession({
            id: started.workout.id,
            startTime: started.workout.start_time,
            minimized: false,
          })
        );
        return started.workout;
      } catch {
        const fallbackSession = createActiveSession({ minimized: false });
        const localWorkout = toLocalWorkoutSession(connection, fallbackSession);
        setSession(fallbackSession);
        setActiveWorkout(localWorkout);
        setWorkoutState(null);
        return localWorkout;
      }
    }).finally(() => {
      if (startResumePromiseRef.current === promise) {
        startResumePromiseRef.current = null;
      }
    });

    startResumePromiseRef.current = promise;
    return promise;
  }, [activeWorkout, connection, fetchWorkoutStateInternal, runAction, session]);

  const finishActiveWorkout = useCallback(async (): Promise<WorkoutSession> => {
    return runAction(async () => {
      if (!activeWorkout) {
        throw new Error('No active workout to finish');
      }

      const finished = await finishWorkoutSession(connection, activeWorkout.id);
      setActiveWorkout(null);
      setWorkoutState(null);
      setSession(createInactiveSession());
      setElapsedSeconds(0);
      return finished.workout;
    });
  }, [activeWorkout, connection, runAction]);

  const addExerciseToActiveWorkout = useCallback(
    async (payload: AddExercisePayload): Promise<void> => {
      await runAction(async () => {
        let targetWorkout = activeWorkout;
        if (!targetWorkout) {
          const resumed = await startOrResumeWorkout();
          targetWorkout = resumed;
        }

        await addExerciseToWorkout(connection, targetWorkout.id, payload);
        await fetchWorkoutStateInternal(targetWorkout.id);
      });
    },
    [activeWorkout, connection, fetchWorkoutStateInternal, runAction, startOrResumeWorkout]
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
        await fetchWorkoutStateInternal(workoutId);
        return result;
      });
    },
    [activeWorkout, connection, fetchWorkoutStateInternal, runAction]
  );

  const patchSetLog = useCallback(
    async (setId: string, payload: SetPatchPayload): Promise<SetResponse> => {
      return runAction(async () => {
        const result = await updateSet(connection, setId, payload);
        if (activeWorkout) {
          await fetchWorkoutStateInternal(activeWorkout.id);
        }
        return result;
      });
    },
    [activeWorkout, connection, fetchWorkoutStateInternal, runAction]
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
          // Fall back to backend search when internet source fails.
        }

        const result = await searchExercises(connection, query, muscleGroup, 30);
        return result.exercises.map((item) => ({
          ...item,
          source: 'backend',
        }));
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
        const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
        const hydratedSession = raw ? parsePersistedSession(raw) : null;

        if (!cancelled && hydratedSession) {
          setSession(hydratedSession);
          setElapsedSeconds(toElapsedSeconds(hydratedSession.startTime));
          setActiveWorkout(toLocalWorkoutSession(connection, hydratedSession));
          setWorkoutState(null);
        }

        try {
          requiredConnection(connection);
          const active = await getActiveWorkout(connection, connection.userId);
          if (cancelled) {
            return;
          }

          if (!active.workout) {
            if (!hydratedSession) {
              setActiveWorkout(null);
              setWorkoutState(null);
              setSession(createInactiveSession());
            }
            return;
          }

          setActiveWorkout(active.workout);
          const details = await fetchWorkoutStateInternal(active.workout.id);
          if (cancelled) {
            return;
          }

          setSession((current) => normalizeSessionFromWorkout(active.workout, details, current.minimized));
        } catch (networkError: unknown) {
          if (!cancelled && !hydratedSession) {
            setSession(createInactiveSession());
            setError(messageFromUnknown(networkError));
          }
        }
      } catch {
        if (!cancelled) {
          setSession(createInactiveSession());
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
  }, [connection, fetchWorkoutStateInternal]);

  useEffect(() => {
    if (!session.isActive) {
      setElapsedSeconds(0);
      return;
    }

    setElapsedSeconds(toElapsedSeconds(session.startTime));
    const timer = setInterval(() => {
      setElapsedSeconds(toElapsedSeconds(session.startTime));
    }, 1000);

    return () => clearInterval(timer);
  }, [session.isActive, session.startTime]);

  useEffect(() => {
    if (!session.isActive) {
      void AsyncStorage.removeItem(SESSION_STORAGE_KEY).catch(() => undefined);
      return;
    }

    const payload: PersistedWorkoutSessionState = {
      id: session.id,
      startTime: session.startTime,
      exercises: session.exercises,
      isActive: session.isActive,
      minimized: session.minimized,
    };

    void AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload)).catch(() => undefined);
  }, [session]);

  useEffect(() => {
    if (!activeWorkout && !workoutState) {
      return;
    }

    const nextSession = normalizeSessionFromWorkout(activeWorkout, workoutState, session.minimized);
    setSession((current) => {
      const sameExercises =
        current.exercises.length === nextSession.exercises.length &&
        current.exercises.every((value, index) => value === nextSession.exercises[index]);

      if (
        current.id === nextSession.id &&
        current.startTime === nextSession.startTime &&
        current.isActive === nextSession.isActive &&
        current.minimized === nextSession.minimized &&
        sameExercises
      ) {
        return current;
      }

      return nextSession;
    });
  }, [activeWorkout, workoutState, session.minimized]);

  const minimizeWorkout = useCallback(() => {
    setSession((current) => {
      if (!current.isActive || current.minimized) {
        return current;
      }
      return {
        ...current,
        minimized: true,
      };
    });
  }, []);

  const restoreWorkout = useCallback(() => {
    setSession((current) => {
      if (!current.minimized) {
        return current;
      }
      return {
        ...current,
        minimized: false,
      };
    });
  }, []);

  const value = useMemo<WorkoutFlowContextValue>(
    () => ({
      connection,
      setConnection,
      session,
      elapsedSeconds,
      busy,
      isInitializing,
      error,
      clearError,
      isWorkoutMinimized: session.minimized,
      minimizeWorkout,
      restoreWorkout,
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
      session,
      elapsedSeconds,
      busy,
      isInitializing,
      error,
      clearError,
      minimizeWorkout,
      restoreWorkout,
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
