// WorkoutContext for global workout state
import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type WorkoutContextSet = {
  id: string;
  type: string;
  weight: number;
  reps: number;
  completed: boolean;
};

export type WorkoutContextExercise = {
  id: string;
  name: string;
  sets: WorkoutContextSet[];
};

type WorkoutContextState = {
  minimized: boolean;
  exercises: WorkoutContextExercise[];
  showLibrary: boolean;
  showDetail: boolean;
  selectedExercise: WorkoutContextExercise | null;
  timer: { running: boolean; mode: 'stopwatch' | 'rest'; seconds: number };
};

type WorkoutContextAction =
  | { type: 'MINIMIZE' }
  | { type: 'RESTORE' }
  | { type: 'OPEN_LIBRARY' }
  | { type: 'CLOSE_LIBRARY' }
  | { type: 'OPEN_DETAIL'; payload: { exerciseId: string } }
  | { type: 'CLOSE_DETAIL' }
  | { type: 'ADD_EXERCISE'; payload: { id: string; name: string } }
  | { type: 'ADD_SET'; payload: { exerciseId: string } }
  | { type: 'TOGGLE_SET_COMPLETE'; payload: { exerciseId: string; setId: string } }
  | { type: 'UPDATE_SET'; payload: { exerciseId: string; setId: string; field: 'weight' | 'reps'; value: number } }
  | { type: 'START_WORKOUT' }
  | { type: 'TICK' }
  | { type: 'HYDRATE'; payload: WorkoutContextState };

const WORKOUT_SESSION_STORAGE_KEY = 'vpulz.workout.session.context.v1';

const initialState: WorkoutContextState = {
  minimized: false,
  exercises: [],
  showLibrary: false,
  showDetail: false,
  selectedExercise: null,
  timer: { running: true, mode: 'stopwatch', seconds: 0 },
};

function createSet(setIndex: number): WorkoutContextSet {
  return {
    id: `set-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: String(setIndex + 1),
    weight: 0,
    reps: 0,
    completed: false,
  };
}

function withRenumberedSets(exercise: WorkoutContextExercise): WorkoutContextExercise {
  return {
    ...exercise,
    sets: exercise.sets.map((set, index) => ({ ...set, type: String(index + 1) })),
  };
}

function resolveSelectedExercise(exercises: WorkoutContextExercise[], selectedId?: string | null): WorkoutContextExercise | null {
  if (!selectedId) {
    return null;
  }
  return exercises.find((exercise) => exercise.id === selectedId) ?? null;
}

function reducer(state: WorkoutContextState, action: WorkoutContextAction): WorkoutContextState {
  if (action.type === 'MINIMIZE') {
    return { ...state, minimized: true };
  }
  if (action.type === 'RESTORE') {
    return { ...state, minimized: false };
  }
  if (action.type === 'OPEN_LIBRARY') {
    return { ...state, showLibrary: true };
  }
  if (action.type === 'CLOSE_LIBRARY') {
    return { ...state, showLibrary: false };
  }
  if (action.type === 'OPEN_DETAIL') {
    const selectedExercise = state.exercises.find((exercise) => exercise.id === action.payload.exerciseId) ?? null;
    return {
      ...state,
      showDetail: Boolean(selectedExercise),
      selectedExercise,
    };
  }
  if (action.type === 'CLOSE_DETAIL') {
    return {
      ...state,
      showDetail: false,
      selectedExercise: null,
    };
  }
  if (action.type === 'ADD_EXERCISE') {
    const nextExercise: WorkoutContextExercise = {
      id: action.payload.id,
      name: action.payload.name,
      sets: [createSet(0)],
    };

    return {
      ...state,
      exercises: [...state.exercises, nextExercise],
      showLibrary: false,
      showDetail: false,
      selectedExercise: null,
      timer: {
        ...state.timer,
        running: true,
      },
    };
  }
  if (action.type === 'ADD_SET') {
    const exercises = state.exercises.map((exercise) => {
      if (exercise.id !== action.payload.exerciseId) {
        return exercise;
      }
      return withRenumberedSets({
        ...exercise,
        sets: [...exercise.sets, createSet(exercise.sets.length)],
      });
    });
    const selectedId = state.selectedExercise?.id;
    return {
      ...state,
      exercises,
      selectedExercise: resolveSelectedExercise(exercises, selectedId),
    };
  }
  if (action.type === 'TOGGLE_SET_COMPLETE') {
    const exercises = state.exercises.map((exercise) => {
      if (exercise.id !== action.payload.exerciseId) {
        return exercise;
      }
      return {
        ...exercise,
        sets: exercise.sets.map((set) =>
          set.id === action.payload.setId ? { ...set, completed: !set.completed } : set
        ),
      };
    });
    const selectedId = state.selectedExercise?.id;
    return {
      ...state,
      exercises,
      selectedExercise: resolveSelectedExercise(exercises, selectedId),
    };
  }
  if (action.type === 'UPDATE_SET') {
    const exercises = state.exercises.map((exercise) => {
      if (exercise.id !== action.payload.exerciseId) {
        return exercise;
      }
      return {
        ...exercise,
        sets: exercise.sets.map((set) => {
          if (set.id !== action.payload.setId) {
            return set;
          }
          return {
            ...set,
            [action.payload.field]: action.payload.value,
          };
        }),
      };
    });
    const selectedId = state.selectedExercise?.id;
    return {
      ...state,
      exercises,
      selectedExercise: resolveSelectedExercise(exercises, selectedId),
    };
  }
  if (action.type === 'START_WORKOUT') {
    return {
      ...state,
      minimized: false,
      showLibrary: state.exercises.length === 0,
      showDetail: false,
      selectedExercise: null,
      timer: {
        ...state.timer,
        running: true,
      },
    };
  }
  if (action.type === 'TICK') {
    if (!state.timer.running) {
      return state;
    }

    return {
      ...state,
      timer: {
        ...state.timer,
        seconds: state.timer.seconds + 1,
      },
    };
  }
  if (action.type === 'HYDRATE') {
    return action.payload;
  }
  return state;
}

function normalizePersistedState(raw: Partial<WorkoutContextState> | null | undefined): WorkoutContextState {
  if (!raw) {
    return initialState;
  }

  return {
    minimized: Boolean(raw.minimized),
    exercises: Array.isArray(raw.exercises)
      ? raw.exercises.map((exercise) => ({
          id: String(exercise.id),
          name: String(exercise.name ?? 'Exercise'),
          sets: Array.isArray(exercise.sets)
            ? exercise.sets.map((set, index) => ({
                id: String(set.id ?? `set-${index}`),
                type: String(set.type ?? index + 1),
                weight: Number.isFinite(set.weight) ? Number(set.weight) : 0,
                reps: Number.isFinite(set.reps) ? Number(set.reps) : 0,
                completed: Boolean(set.completed),
              }))
            : [createSet(0)],
        }))
      : [],
    showLibrary: Boolean(raw.showLibrary),
    showDetail: Boolean(raw.showDetail),
    selectedExercise: null,
    timer:
      raw.timer && typeof raw.timer.seconds === 'number'
        ? {
            running: Boolean(raw.timer.running),
            mode: raw.timer.mode === 'rest' ? 'rest' : 'stopwatch',
            seconds: Math.max(0, Math.floor(raw.timer.seconds)),
          }
        : initialState.timer,
  };
}

async function persistWorkoutContextState(state: WorkoutContextState): Promise<void> {
  await AsyncStorage.setItem(WORKOUT_SESSION_STORAGE_KEY, JSON.stringify(state));
}

async function loadPersistedWorkoutContextState(): Promise<WorkoutContextState | null> {
  try {
    const raw = await AsyncStorage.getItem(WORKOUT_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return normalizePersistedState(JSON.parse(raw) as Partial<WorkoutContextState>);
  } catch {
    return null;
  }
}

type WorkoutContextValue = WorkoutContextState & {
  dispatch: React.Dispatch<WorkoutContextAction>;
  minimizeWorkout: () => void;
  restoreFullScreen: () => void;
  startWorkout: () => void;
  openExerciseLibrary: () => void;
  closeExerciseLibrary: () => void;
  addExerciseToWorkout: (exercise: { id?: string; name: string }) => void;
  addSetToExercise: (exerciseId?: string) => void;
  toggleSetComplete: (exerciseId: string, setId: string) => void;
  updateSetValue: (exerciseId: string, setId: string, field: 'weight' | 'reps', value: number) => void;
  openExerciseDetail: (exerciseId: string) => void;
  closeExerciseDetail: () => void;
};

const WorkoutContext = createContext<WorkoutContextValue>({
  ...initialState,
  dispatch: () => undefined,
  minimizeWorkout: () => undefined,
  restoreFullScreen: () => undefined,
  startWorkout: () => undefined,
  openExerciseLibrary: () => undefined,
  closeExerciseLibrary: () => undefined,
  addExerciseToWorkout: () => undefined,
  addSetToExercise: () => undefined,
  toggleSetComplete: () => undefined,
  updateSetValue: () => undefined,
  openExerciseDetail: () => undefined,
  closeExerciseDetail: () => undefined,
});

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const hydratedRef = useRef(false);
  const stateRef = useRef(state);

  stateRef.current = state;

  useEffect(() => {
    let mounted = true;

    void loadPersistedWorkoutContextState()
      .then((persisted) => {
        if (!mounted || !persisted) {
          return;
        }
        dispatch({ type: 'HYDRATE', payload: persisted });
      })
      .finally(() => {
        hydratedRef.current = true;
        void persistWorkoutContextState(stateRef.current).catch(() => undefined);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) {
      return;
    }
    void persistWorkoutContextState(state).catch(() => undefined);
  }, [state]);

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'TICK' });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'inactive' || nextState === 'background') {
        void persistWorkoutContextState(stateRef.current).catch(() => undefined);
        return;
      }

      if (nextState === 'active') {
        void loadPersistedWorkoutContextState().then((persisted) => {
          if (!persisted) {
            return;
          }
          dispatch({ type: 'HYDRATE', payload: persisted });
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const value = useMemo<WorkoutContextValue>(
    () => ({
      ...state,
      dispatch,
      minimizeWorkout: () => dispatch({ type: 'MINIMIZE' }),
      restoreFullScreen: () => dispatch({ type: 'RESTORE' }),
      startWorkout: () => dispatch({ type: 'START_WORKOUT' }),
      openExerciseLibrary: () => dispatch({ type: 'OPEN_LIBRARY' }),
      closeExerciseLibrary: () => dispatch({ type: 'CLOSE_LIBRARY' }),
      addExerciseToWorkout: ({ id, name }) => {
        const normalizedName = name.trim();
        if (!normalizedName) {
          return;
        }
        const generatedId = id ?? `${normalizedName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
        dispatch({ type: 'ADD_EXERCISE', payload: { id: generatedId, name: normalizedName } });
      },
      addSetToExercise: (exerciseId) => {
        const targetExerciseId = exerciseId ?? state.exercises[state.exercises.length - 1]?.id;
        if (!targetExerciseId) {
          return;
        }
        dispatch({ type: 'ADD_SET', payload: { exerciseId: targetExerciseId } });
      },
      toggleSetComplete: (exerciseId, setId) => dispatch({ type: 'TOGGLE_SET_COMPLETE', payload: { exerciseId, setId } }),
      updateSetValue: (exerciseId, setId, field, value) =>
        dispatch({ type: 'UPDATE_SET', payload: { exerciseId, setId, field, value } }),
      openExerciseDetail: (exerciseId) => dispatch({ type: 'OPEN_DETAIL', payload: { exerciseId } }),
      closeExerciseDetail: () => dispatch({ type: 'CLOSE_DETAIL' }),
    }),
    [state]
  );

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkoutContext() {
  return useContext(WorkoutContext);
}
