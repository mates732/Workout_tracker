import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { addDays, toDateKey } from "../utils/workoutLoggerDate";

export type SetType = "normal" | "warmup" | "dropset" | "failure";

export type WorkoutSet = {
  id: string;
  kg: number;
  reps: number;
  completed: boolean;
  previous: { kg: number; reps: number } | null;
  type: SetType;
};

export type WorkoutExercise = {
  id: string;
  name: string;
  muscle: string;
  notes: string;
  sets: WorkoutSet[];
};

export type WorkoutSession = {
  id: string;
  title: string;
  dateKey: string;
  startTime: number;
  exercises: WorkoutExercise[];
};

export type ExerciseLibraryItem = {
  id: string;
  name: string;
  muscle: string;
};

export type SavedRoutine = {
  id: string;
  name: string;
  exercises: string[];
};

export type CalendarWorkout = {
  id: string;
  title: string;
  exercises: string[];
  durationMin: number;
  source: "planned" | "completed";
};

type WorkoutLoggerContextValue = {
  selectedDate: string;
  setSelectedDate: (dateKey: string) => void;
  workoutDates: string[];
  workoutsForSelectedDate: CalendarWorkout[];
  routineTemplates: SavedRoutine[];
  exerciseLibrary: ExerciseLibraryItem[];
  workout: WorkoutSession | null;
  timerElapsedSec: number;
  timerRunning: boolean;
  startTimer: () => void;
  stopTimer: () => void;
  toggleTimer: () => void;
  setWorkoutScreenActive: (active: boolean) => void;
  ensureWorkout: () => void;
  startBlankWorkout: () => void;
  startRoutineWorkout: (routine: SavedRoutine) => void;
  startWorkoutFromCalendarEntry: (entry: CalendarWorkout) => void;
  finishWorkout: () => void;
  discardWorkout: () => void;
  addExercisesToWorkout: (exerciseNames: string[]) => void;
  updateExerciseNotes: (exerciseId: string, notes: string) => void;
  removeExercise: (exerciseId: string) => void;
  updateSetValue: (
    exerciseId: string,
    setId: string,
    field: "kg" | "reps",
    value: number
  ) => void;
  toggleSetCompleted: (exerciseId: string, setId: string) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  addSetRow: (exerciseId: string) => void;
  cycleSetType: (exerciseId: string, setId: string) => void;
};

const WorkoutLoggerContext = createContext<WorkoutLoggerContextValue | undefined>(
  undefined
);

const EXERCISE_LIBRARY: ExerciseLibraryItem[] = [
  { id: "squat", name: "Squat", muscle: "Legs" },
  { id: "deadlift", name: "Deadlift", muscle: "Back" },
  { id: "trap-bar-deadlift", name: "Deadlift (Trap Bar)", muscle: "Back" },
  { id: "bench-press", name: "Bench Press", muscle: "Chest" },
  { id: "overhead-press", name: "Overhead Press", muscle: "Shoulders" },
  { id: "pull-up", name: "Pull-Up", muscle: "Back" },
  { id: "barbell-row", name: "Barbell Row", muscle: "Back" },
  { id: "romanian-deadlift", name: "Romanian Deadlift", muscle: "Legs" },
  { id: "leg-press", name: "Leg Press", muscle: "Legs" },
  {
    id: "bulgarian-split-squat",
    name: "Bulgarian Split Squat",
    muscle: "Legs",
  },
  { id: "hip-thrust", name: "Hip Thrust", muscle: "Legs" },
  {
    id: "incline-bench-press",
    name: "Incline Bench Press",
    muscle: "Chest",
  },
  { id: "cable-row", name: "Cable Row", muscle: "Back" },
  { id: "lat-pulldown", name: "Lat Pulldown", muscle: "Back" },
  { id: "dumbbell-curl", name: "Dumbbell Curl", muscle: "Arms" },
  { id: "tricep-pushdown", name: "Tricep Pushdown", muscle: "Arms" },
  { id: "lateral-raise", name: "Lateral Raise", muscle: "Shoulders" },
  { id: "face-pull", name: "Face Pull", muscle: "Shoulders" },
  { id: "calf-raise", name: "Calf Raise", muscle: "Legs" },
  { id: "plank", name: "Plank", muscle: "Core" },
];

const ROUTINES: SavedRoutine[] = [
  {
    id: "push-day-a",
    name: "Push Day A",
    exercises: [
      "Bench Press",
      "Overhead Press",
      "Incline Bench Press",
      "Lateral Raise",
      "Tricep Pushdown",
    ],
  },
  {
    id: "pull-day-a",
    name: "Pull Day A",
    exercises: ["Deadlift", "Barbell Row", "Lat Pulldown", "Cable Row", "Dumbbell Curl"],
  },
  {
    id: "leg-day-a",
    name: "Leg Day A",
    exercises: [
      "Squat",
      "Romanian Deadlift",
      "Bulgarian Split Squat",
      "Leg Press",
      "Calf Raise",
    ],
  },
];

const SET_TYPE_ORDER: SetType[] = ["normal", "warmup", "dropset", "failure"];

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function findMuscleGroup(exerciseName: string): string {
  return EXERCISE_LIBRARY.find((item) => item.name === exerciseName)?.muscle ?? "Other";
}

function makeSet(previous?: WorkoutSet | null): WorkoutSet {
  return {
    id: uid(),
    kg: previous?.kg ?? 0,
    reps: previous?.reps ?? 0,
    completed: false,
    previous: previous ? { kg: previous.kg, reps: previous.reps } : null,
    type: "normal",
  };
}

function makeExercise(name: string): WorkoutExercise {
  return {
    id: uid(),
    name,
    muscle: findMuscleGroup(name),
    notes: "",
    sets: [makeSet()],
  };
}

function seedExercises(): WorkoutExercise[] {
  return [
    {
      id: uid(),
      name: "Deadlift (Trap Bar)",
      muscle: "Back",
      notes: "",
      sets: [
        { id: uid(), kg: 100, reps: 6, completed: false, previous: { kg: 100, reps: 6 }, type: "normal" },
        { id: uid(), kg: 100, reps: 6, completed: false, previous: { kg: 100, reps: 6 }, type: "normal" },
      ],
    },
    {
      id: uid(),
      name: "Bulgarian Split Squat",
      muscle: "Legs",
      notes: "",
      sets: [
        {
          id: uid(),
          kg: 32.5,
          reps: 8,
          completed: false,
          previous: { kg: 32.5, reps: 8 },
          type: "normal",
        },
      ],
    },
  ];
}

function initialCalendarMap(): Record<string, CalendarWorkout[]> {
  const today = new Date();
  const todayKey = toDateKey(today);
  const plusOneKey = toDateKey(addDays(today, 1));
  const plusTwoKey = toDateKey(addDays(today, 2));

  return {
    [todayKey]: [
      {
        id: `planned-${uid()}`,
        title: "Push Day A",
        exercises: ROUTINES[0].exercises,
        durationMin: 50,
        source: "planned",
      },
    ],
    [plusOneKey]: [
      {
        id: `planned-${uid()}`,
        title: "Pull Day A",
        exercises: ROUTINES[1].exercises,
        durationMin: 55,
        source: "planned",
      },
    ],
    [plusTwoKey]: [
      {
        id: `planned-${uid()}`,
        title: "Leg Day A",
        exercises: ROUTINES[2].exercises,
        durationMin: 60,
        source: "planned",
      },
    ],
  };
}

function sanitizeNumber(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value * 100) / 100);
}

export function WorkoutLoggerProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [selectedDate, setSelectedDateState] = useState<string>(toDateKey(new Date()));
  const [calendarEntriesByDate, setCalendarEntriesByDate] = useState<Record<string, CalendarWorkout[]>>(
    () => initialCalendarMap()
  );

  const [workout, setWorkout] = useState<WorkoutSession | null>(null);
  const [timerElapsedSec, setTimerElapsedSec] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [isWorkoutScreenActive, setIsWorkoutScreenActive] = useState<boolean>(false);

  useEffect(() => {
    if (!workout || !timerRunning || !isWorkoutScreenActive) {
      return undefined;
    }

    const interval = setInterval(() => {
      setTimerElapsedSec((current) => current + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isWorkoutScreenActive, timerRunning, workout]);

  const setSelectedDate = useCallback((dateKey: string): void => {
    setSelectedDateState(dateKey);
  }, []);

  const startWorkout = useCallback(
    (title: string, exerciseNames: string[]): void => {
      const exercises =
        exerciseNames.length > 0 ? exerciseNames.map((exerciseName) => makeExercise(exerciseName)) : seedExercises();

      setWorkout({
        id: uid(),
        title,
        dateKey: selectedDate,
        startTime: Date.now(),
        exercises,
      });
      setTimerElapsedSec(0);
      setTimerRunning(true);
    },
    [selectedDate]
  );

  const startBlankWorkout = useCallback((): void => {
    startWorkout("Blank Workout", []);
  }, [startWorkout]);

  const ensureWorkout = useCallback((): void => {
    setWorkout((current) => {
      if (current) {
        return current;
      }

      const seeded = seedExercises();
      return {
        id: uid(),
        title: "Blank Workout",
        dateKey: selectedDate,
        startTime: Date.now(),
        exercises: seeded,
      };
    });
    setTimerRunning(true);
    setTimerElapsedSec((current) => (current < 0 ? 0 : current));
  }, [selectedDate]);

  const startRoutineWorkout = useCallback(
    (routine: SavedRoutine): void => {
      startWorkout(routine.name, routine.exercises);
    },
    [startWorkout]
  );

  const startWorkoutFromCalendarEntry = useCallback(
    (entry: CalendarWorkout): void => {
      startWorkout(entry.title, entry.exercises);
    },
    [startWorkout]
  );

  const startTimer = useCallback((): void => {
    if (!workout) {
      return;
    }
    setTimerRunning(true);
  }, [workout]);

  const stopTimer = useCallback((): void => {
    setTimerRunning(false);
  }, []);

  const toggleTimer = useCallback((): void => {
    if (!workout) {
      return;
    }
    setTimerRunning((current) => !current);
  }, [workout]);

  const setWorkoutScreenActive = useCallback((active: boolean): void => {
    setIsWorkoutScreenActive(active);
  }, []);

  const discardWorkout = useCallback((): void => {
    setWorkout(null);
    setTimerElapsedSec(0);
    setTimerRunning(false);
    setIsWorkoutScreenActive(false);
  }, []);

  const finishWorkout = useCallback((): void => {
    if (!workout) {
      return;
    }

    const completedEntry: CalendarWorkout = {
      id: `done-${uid()}`,
      title: workout.title,
      exercises: workout.exercises.map((exercise) => exercise.name),
      durationMin: Math.max(1, Math.round(timerElapsedSec / 60)),
      source: "completed",
    };

    setCalendarEntriesByDate((current) => {
      const currentList = current[workout.dateKey] ?? [];
      return {
        ...current,
        [workout.dateKey]: [completedEntry, ...currentList],
      };
    });

    setSelectedDateState(workout.dateKey);
    setWorkout(null);
    setTimerElapsedSec(0);
    setTimerRunning(false);
    setIsWorkoutScreenActive(false);
  }, [timerElapsedSec, workout]);

  const addExercisesToWorkout = useCallback((exerciseNames: string[]): void => {
    if (exerciseNames.length === 0) {
      return;
    }

    setWorkout((current) => {
      if (!current) {
        return current;
      }

      const existing = new Set(current.exercises.map((exercise) => exercise.name.toLowerCase()));
      const additions = exerciseNames
        .filter((name, index) => exerciseNames.indexOf(name) === index)
        .filter((name) => !existing.has(name.toLowerCase()))
        .map((name) => makeExercise(name));

      if (!additions.length) {
        return current;
      }

      return {
        ...current,
        exercises: [...current.exercises, ...additions],
      };
    });
  }, []);

  const updateExerciseNotes = useCallback((exerciseId: string, notes: string): void => {
    setWorkout((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        exercises: current.exercises.map((exercise) =>
          exercise.id === exerciseId ? { ...exercise, notes } : exercise
        ),
      };
    });
  }, []);

  const removeExercise = useCallback((exerciseId: string): void => {
    setWorkout((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        exercises: current.exercises.filter((exercise) => exercise.id !== exerciseId),
      };
    });
  }, []);

  const updateSetValue = useCallback(
    (exerciseId: string, setId: string, field: "kg" | "reps", value: number): void => {
      setWorkout((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          exercises: current.exercises.map((exercise) => {
            if (exercise.id !== exerciseId) {
              return exercise;
            }

            return {
              ...exercise,
              sets: exercise.sets.map((setItem) =>
                setItem.id === setId
                  ? {
                      ...setItem,
                      [field]: sanitizeNumber(value),
                    }
                  : setItem
              ),
            };
          }),
        };
      });
    },
    []
  );

  const toggleSetCompleted = useCallback((exerciseId: string, setId: string): void => {
    setWorkout((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        exercises: current.exercises.map((exercise) => {
          if (exercise.id !== exerciseId) {
            return exercise;
          }

          return {
            ...exercise,
            sets: exercise.sets.map((setItem) =>
              setItem.id === setId ? { ...setItem, completed: !setItem.completed } : setItem
            ),
          };
        }),
      };
    });
  }, []);

  const removeSet = useCallback((exerciseId: string, setId: string): void => {
    setWorkout((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        exercises: current.exercises.map((exercise) => {
          if (exercise.id !== exerciseId || exercise.sets.length === 1) {
            return exercise;
          }

          return {
            ...exercise,
            sets: exercise.sets.filter((setItem) => setItem.id !== setId),
          };
        }),
      };
    });
  }, []);

  const addSetRow = useCallback((exerciseId: string): void => {
    setWorkout((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        exercises: current.exercises.map((exercise) => {
          if (exercise.id !== exerciseId) {
            return exercise;
          }

          const last = exercise.sets[exercise.sets.length - 1] ?? null;
          return {
            ...exercise,
            sets: [...exercise.sets, makeSet(last)],
          };
        }),
      };
    });
  }, []);

  const cycleSetType = useCallback((exerciseId: string, setId: string): void => {
    setWorkout((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        exercises: current.exercises.map((exercise) => {
          if (exercise.id !== exerciseId) {
            return exercise;
          }

          return {
            ...exercise,
            sets: exercise.sets.map((setItem) => {
              if (setItem.id !== setId) {
                return setItem;
              }

              const index = SET_TYPE_ORDER.indexOf(setItem.type);
              const nextType = SET_TYPE_ORDER[(index + 1) % SET_TYPE_ORDER.length];
              return {
                ...setItem,
                type: nextType,
              };
            }),
          };
        }),
      };
    });
  }, []);

  const workoutsForSelectedDate = useMemo<CalendarWorkout[]>(() => {
    return calendarEntriesByDate[selectedDate] ?? [];
  }, [calendarEntriesByDate, selectedDate]);

  const workoutDates = useMemo<string[]>(() => {
    return Object.keys(calendarEntriesByDate);
  }, [calendarEntriesByDate]);

  const value = useMemo<WorkoutLoggerContextValue>(
    () => ({
      selectedDate,
      setSelectedDate,
      workoutDates,
      workoutsForSelectedDate,
      routineTemplates: ROUTINES,
      exerciseLibrary: EXERCISE_LIBRARY,
      workout,
      timerElapsedSec,
      timerRunning,
      startTimer,
      stopTimer,
      toggleTimer,
      setWorkoutScreenActive,
      ensureWorkout,
      startBlankWorkout,
      startRoutineWorkout,
      startWorkoutFromCalendarEntry,
      finishWorkout,
      discardWorkout,
      addExercisesToWorkout,
      updateExerciseNotes,
      removeExercise,
      updateSetValue,
      toggleSetCompleted,
      removeSet,
      addSetRow,
      cycleSetType,
    }),
    [
      addExercisesToWorkout,
      addSetRow,
      cycleSetType,
      discardWorkout,
      ensureWorkout,
      finishWorkout,
      removeExercise,
      removeSet,
      selectedDate,
      setSelectedDate,
      setWorkoutScreenActive,
      startBlankWorkout,
      startRoutineWorkout,
      startTimer,
      startWorkoutFromCalendarEntry,
      stopTimer,
      timerElapsedSec,
      timerRunning,
      toggleSetCompleted,
      toggleTimer,
      updateExerciseNotes,
      updateSetValue,
      workout,
      workoutDates,
      workoutsForSelectedDate,
    ]
  );

  return <WorkoutLoggerContext.Provider value={value}>{children}</WorkoutLoggerContext.Provider>;
}

export function useWorkoutLogger(): WorkoutLoggerContextValue {
  const context = useContext(WorkoutLoggerContext);
  if (!context) {
    throw new Error("useWorkoutLogger must be used within WorkoutLoggerProvider");
  }

  return context;
}
