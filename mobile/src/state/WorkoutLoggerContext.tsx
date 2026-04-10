import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { addDays, toDateKey, fromDateKey } from "../utils/workoutLoggerDate";

// ─── Core types ─────────────────────────────────────────────────────────────

export type SplitType = "push" | "pull" | "legs";

export type DayStatus = "future" | "completed" | "missed" | "sick";

export type DayInfo = {
  split: SplitType;
  status: DayStatus;
  routine: SavedRoutine;
};

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
  split: SplitType;
  exercises: string[];
};

export type CalendarWorkout = {
  id: string;
  title: string;
  split: SplitType | null;
  exercises: string[];
  exerciseDetails?: WorkoutExercise[];
  durationMin: number;
  totalVolume?: number;
  source: "planned" | "completed" | "sick";
  startTime?: number;
};

export type WeeklyStats = {
  workoutCount: number;
  totalVolume: number;
};

// ─── Storage keys ────────────────────────────────────────────────────────────

const SK = {
  CALENDAR_ENTRIES: "@wt/calendar_entries",
  WORKOUT: "@wt/active_workout",
  TIMER_ELAPSED: "@wt/timer_elapsed",
} as const;

// ─── Context shape ───────────────────────────────────────────────────────────

type WorkoutLoggerContextValue = {
  selectedDate: string;
  setSelectedDate: (dateKey: string) => void;
  calendarDays: Record<string, DayInfo>;
  workoutsForSelectedDate: CalendarWorkout[];
  routineTemplates: SavedRoutine[];
  exerciseLibrary: ExerciseLibraryItem[];
  workout: WorkoutSession | null;
  timerElapsedSec: number;
  timerRunning: boolean;
  isLoaded: boolean;
  weeklyStats: WeeklyStats;
  lastCompletedWorkout: (CalendarWorkout & { dateKey: string }) | null;
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
  updateSetValue: (exerciseId: string, setId: string, field: "kg" | "reps", value: number) => void;
  toggleSetCompleted: (exerciseId: string, setId: string) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  addSetRow: (exerciseId: string) => void;
  cycleSetType: (exerciseId: string, setId: string) => void;
  markSickDay: (dateKey: string) => void;
  undoSickDay: (dateKey: string) => void;
  moveWorkout: (fromDateKey: string, toDateKey: string) => void;
  switchRoutineOnDate: (dateKey: string, routineId: string) => void;
};

const WorkoutLoggerContext = createContext<WorkoutLoggerContextValue | undefined>(undefined);

// ─── Static data ─────────────────────────────────────────────────────────────

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
  { id: "bulgarian-split-squat", name: "Bulgarian Split Squat", muscle: "Legs" },
  { id: "hip-thrust", name: "Hip Thrust", muscle: "Legs" },
  { id: "incline-bench-press", name: "Incline Bench Press", muscle: "Chest" },
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
    split: "push",
    exercises: ["Bench Press", "Overhead Press", "Incline Bench Press", "Lateral Raise", "Tricep Pushdown"],
  },
  {
    id: "pull-day-a",
    name: "Pull Day A",
    split: "pull",
    exercises: ["Deadlift", "Barbell Row", "Lat Pulldown", "Cable Row", "Dumbbell Curl"],
  },
  {
    id: "leg-day-a",
    name: "Leg Day A",
    split: "legs",
    exercises: ["Squat", "Romanian Deadlift", "Bulgarian Split Squat", "Leg Press", "Calf Raise"],
  },
];

// PPL cycle: 3 on, 1 rest (null = rest)
const SPLIT_CYCLE: Array<SplitType | null> = ["push", "pull", "legs", null];

// ─── Split schedule helpers ───────────────────────────────────────────────────

function getSplitForDateKey(dateKey: string, cycleStartKey: string): SplitType | null {
  const startEpoch = Math.floor(fromDateKey(cycleStartKey).getTime() / 86400000);
  const targetEpoch = Math.floor(fromDateKey(dateKey).getTime() / 86400000);
  const diff = targetEpoch - startEpoch;
  const pos = ((diff % 4) + 4) % 4;
  return SPLIT_CYCLE[pos];
}

// ─── Utility ─────────────────────────────────────────────────────────────────

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
        { id: uid(), kg: 32.5, reps: 8, completed: false, previous: { kg: 32.5, reps: 8 }, type: "normal" },
      ],
    },
  ];
}

function sanitizeNumber(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value * 100) / 100);
}

function calcVolume(exercises: WorkoutExercise[]): number {
  let vol = 0;
  for (const ex of exercises) {
    for (const s of ex.sets) {
      if (s.completed) vol += s.kg * s.reps;
    }
  }
  return Math.round(vol);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function WorkoutLoggerProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedDate, setSelectedDateState] = useState<string>(toDateKey(new Date()));
  const [splitCycleStartKey] = useState<string>(() => toDateKey(new Date()));
  const [calendarEntriesByDate, setCalendarEntriesByDate] = useState<Record<string, CalendarWorkout[]>>({});
  const [workout, setWorkout] = useState<WorkoutSession | null>(null);
  const [timerElapsedSec, setTimerElapsedSec] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [isWorkoutScreenActive, setIsWorkoutScreenActive] = useState<boolean>(false);
  const timerSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load persisted state on mount ────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [entriesJson, workoutJson, timerJson] = await Promise.all([
          AsyncStorage.getItem(SK.CALENDAR_ENTRIES),
          AsyncStorage.getItem(SK.WORKOUT),
          AsyncStorage.getItem(SK.TIMER_ELAPSED),
        ]);
        if (entriesJson) {
          setCalendarEntriesByDate(JSON.parse(entriesJson) as Record<string, CalendarWorkout[]>);
        }
        if (workoutJson) {
          setWorkout(JSON.parse(workoutJson) as WorkoutSession);
        }
        if (timerJson) {
          setTimerElapsedSec(JSON.parse(timerJson) as number);
        }
      } catch {
        // Silent — start fresh if storage fails
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  // ── Persist calendar entries ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(SK.CALENDAR_ENTRIES, JSON.stringify(calendarEntriesByDate)).catch(() => {});
  }, [calendarEntriesByDate, isLoaded]);

  // ── Persist active workout ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    if (workout) {
      AsyncStorage.setItem(SK.WORKOUT, JSON.stringify(workout)).catch(() => {});
    } else {
      AsyncStorage.removeItem(SK.WORKOUT).catch(() => {});
    }
  }, [workout, isLoaded]);

  // ── Timer tick ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!workout || !timerRunning || !isWorkoutScreenActive) return undefined;
    const interval = setInterval(() => {
      setTimerElapsedSec((current) => current + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isWorkoutScreenActive, timerRunning, workout]);

  // ── Persist timer (debounced — max 1 write per 5 s) ──────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    if (timerSaveRef.current) clearTimeout(timerSaveRef.current);
    timerSaveRef.current = setTimeout(() => {
      AsyncStorage.setItem(SK.TIMER_ELAPSED, JSON.stringify(timerElapsedSec)).catch(() => {});
    }, 5000);
    return () => {
      if (timerSaveRef.current) clearTimeout(timerSaveRef.current);
    };
  }, [timerElapsedSec, isLoaded]);

  // ── Calendar days (merged split schedule + user overrides) ───────────────────
  const calendarDays = useMemo<Record<string, DayInfo>>(() => {
    const result: Record<string, DayInfo> = {};
    const todayKey = toDateKey(new Date());

    for (let i = -30; i <= 60; i++) {
      const date = addDays(fromDateKey(todayKey), i);
      const dateKey = toDateKey(date);
      const split = getSplitForDateKey(dateKey, splitCycleStartKey);
      if (!split) continue;

      const routine = ROUTINES.find((r) => r.split === split)!;
      const entries = calendarEntriesByDate[dateKey] ?? [];
      const hasSick = entries.some((e) => e.source === "sick");
      const hasCompleted = entries.some((e) => e.source === "completed");

      let status: DayStatus;
      if (hasSick) {
        status = "sick";
      } else if (hasCompleted) {
        status = "completed";
      } else if (dateKey < todayKey) {
        status = "missed";
      } else {
        status = "future";
      }

      result[dateKey] = { split, status, routine };
    }

    return result;
  }, [calendarEntriesByDate, splitCycleStartKey]);

  // ── workoutsForSelectedDate ──────────────────────────────────────────────────
  const workoutsForSelectedDate = useMemo<CalendarWorkout[]>(() => {
    const entries = calendarEntriesByDate[selectedDate] ?? [];
    if (entries.length > 0) return entries;

    const dayInfo = calendarDays[selectedDate];
    if (!dayInfo) return [];

    return [
      {
        id: `split-${selectedDate}`,
        title: dayInfo.routine.name,
        split: dayInfo.split,
        exercises: dayInfo.routine.exercises,
        durationMin: 50,
        source: "planned",
      },
    ];
  }, [calendarEntriesByDate, calendarDays, selectedDate]);

  // ── Weekly stats (last 7 days) ───────────────────────────────────────────────
  const weeklyStats = useMemo<WeeklyStats>(() => {
    let workoutCount = 0;
    let totalVolume = 0;
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const dateKey = toDateKey(addDays(now, -i));
      const entries = calendarEntriesByDate[dateKey] ?? [];
      for (const entry of entries) {
        if (entry.source === "completed") {
          workoutCount++;
          totalVolume += entry.totalVolume ?? 0;
        }
      }
    }

    return { workoutCount, totalVolume };
  }, [calendarEntriesByDate]);

  // ── Last completed workout ───────────────────────────────────────────────────
  const lastCompletedWorkout = useMemo<(CalendarWorkout & { dateKey: string }) | null>(() => {
    const sortedKeys = Object.keys(calendarEntriesByDate).sort().reverse();
    for (const dateKey of sortedKeys) {
      const completed = calendarEntriesByDate[dateKey].find((e) => e.source === "completed");
      if (completed) return { ...completed, dateKey };
    }
    return null;
  }, [calendarEntriesByDate]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const setSelectedDate = useCallback((dateKey: string): void => {
    setSelectedDateState(dateKey);
  }, []);

  const startWorkout = useCallback(
    (title: string, exerciseNames: string[]): void => {
      const exercises =
        exerciseNames.length > 0
          ? exerciseNames.map((name) => makeExercise(name))
          : seedExercises();
      setWorkout({ id: uid(), title, dateKey: selectedDate, startTime: Date.now(), exercises });
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
      if (current) return current;
      return { id: uid(), title: "Blank Workout", dateKey: selectedDate, startTime: Date.now(), exercises: seedExercises() };
    });
    setTimerRunning(true);
    setTimerElapsedSec((current) => (current < 0 ? 0 : current));
  }, [selectedDate]);

  const startRoutineWorkout = useCallback(
    (routine: SavedRoutine): void => startWorkout(routine.name, routine.exercises),
    [startWorkout]
  );

  const startWorkoutFromCalendarEntry = useCallback(
    (entry: CalendarWorkout): void => startWorkout(entry.title, entry.exercises),
    [startWorkout]
  );

  const startTimer = useCallback((): void => {
    if (!workout) return;
    setTimerRunning(true);
  }, [workout]);

  const stopTimer = useCallback((): void => setTimerRunning(false), []);

  const toggleTimer = useCallback((): void => {
    if (!workout) return;
    setTimerRunning((c) => !c);
  }, [workout]);

  const setWorkoutScreenActive = useCallback((active: boolean): void => {
    setIsWorkoutScreenActive(active);
  }, []);

  const discardWorkout = useCallback((): void => {
    setWorkout(null);
    setTimerElapsedSec(0);
    setTimerRunning(false);
    setIsWorkoutScreenActive(false);
    AsyncStorage.removeItem(SK.WORKOUT).catch(() => {});
    AsyncStorage.setItem(SK.TIMER_ELAPSED, "0").catch(() => {});
  }, []);

  const finishWorkout = useCallback((): void => {
    if (!workout) return;

    const workoutSplit = ROUTINES.find((r) => r.name === workout.title)?.split ?? null;
    const volume = calcVolume(workout.exercises);

    const completedEntry: CalendarWorkout = {
      id: `done-${uid()}`,
      title: workout.title,
      split: workoutSplit,
      exercises: workout.exercises.map((e) => e.name),
      exerciseDetails: workout.exercises,
      durationMin: Math.max(1, Math.round(timerElapsedSec / 60)),
      totalVolume: volume,
      source: "completed",
      startTime: workout.startTime,
    };

    setCalendarEntriesByDate((current) => {
      const currentList = (current[workout.dateKey] ?? []).filter((e) => e.source !== "planned");
      return { ...current, [workout.dateKey]: [completedEntry, ...currentList] };
    });

    setSelectedDateState(workout.dateKey);
    setWorkout(null);
    setTimerElapsedSec(0);
    setTimerRunning(false);
    setIsWorkoutScreenActive(false);
    AsyncStorage.removeItem(SK.WORKOUT).catch(() => {});
    AsyncStorage.setItem(SK.TIMER_ELAPSED, "0").catch(() => {});
  }, [timerElapsedSec, workout]);

  const markSickDay = useCallback((dateKey: string): void => {
    setCalendarEntriesByDate((current) => {
      const filtered = (current[dateKey] ?? []).filter((e) => e.source !== "sick");
      const sickEntry: CalendarWorkout = {
        id: `sick-${dateKey}`,
        title: "Sick Day",
        split: null,
        exercises: [],
        durationMin: 0,
        source: "sick",
      };
      return { ...current, [dateKey]: [sickEntry, ...filtered] };
    });
  }, []);

  const undoSickDay = useCallback((dateKey: string): void => {
    setCalendarEntriesByDate((current) => {
      const filtered = (current[dateKey] ?? []).filter((e) => e.source !== "sick");
      const updated = { ...current, [dateKey]: filtered };
      if (!filtered.length) delete updated[dateKey];
      return updated;
    });
  }, []);

  const moveWorkout = useCallback((fromKey: string, toKey: string): void => {
    setCalendarEntriesByDate((current) => {
      const dayInfo = calendarDays[fromKey];
      if (!dayInfo) return current;

      const toEntries = current[toKey] ?? [];
      const override: CalendarWorkout = {
        id: `moved-${toKey}-${uid()}`,
        title: dayInfo.routine.name,
        split: dayInfo.split,
        exercises: dayInfo.routine.exercises,
        durationMin: 50,
        source: "planned",
      };

      const sickEntry: CalendarWorkout = {
        id: `sick-${fromKey}`,
        title: "Moved",
        split: null,
        exercises: [],
        durationMin: 0,
        source: "sick",
      };

      return {
        ...current,
        [fromKey]: [sickEntry],
        [toKey]: [override, ...toEntries],
      };
    });
  }, [calendarDays]);

  const switchRoutineOnDate = useCallback((dateKey: string, routineId: string): void => {
    const routine = ROUTINES.find((r) => r.id === routineId);
    if (!routine) return;

    setCalendarEntriesByDate((current) => {
      const kept = (current[dateKey] ?? []).filter((e) => e.source === "completed" || e.source === "sick");
      const override: CalendarWorkout = {
        id: `override-${dateKey}`,
        title: routine.name,
        split: routine.split,
        exercises: routine.exercises,
        durationMin: 50,
        source: "planned",
      };
      return { ...current, [dateKey]: [override, ...kept] };
    });
  }, []);

  // ── Exercise / set mutations ──────────────────────────────────────────────────

  const addExercisesToWorkout = useCallback((exerciseNames: string[]): void => {
    if (!exerciseNames.length) return;
    setWorkout((current) => {
      if (!current) return current;
      const existing = new Set(current.exercises.map((e) => e.name.toLowerCase()));
      const additions = exerciseNames
        .filter((n, i) => exerciseNames.indexOf(n) === i)
        .filter((n) => !existing.has(n.toLowerCase()))
        .map((n) => makeExercise(n));
      if (!additions.length) return current;
      return { ...current, exercises: [...current.exercises, ...additions] };
    });
  }, []);

  const updateExerciseNotes = useCallback((exerciseId: string, notes: string): void => {
    setWorkout((current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: current.exercises.map((e) => (e.id === exerciseId ? { ...e, notes } : e)),
      };
    });
  }, []);

  const removeExercise = useCallback((exerciseId: string): void => {
    setWorkout((current) => {
      if (!current) return current;
      return { ...current, exercises: current.exercises.filter((e) => e.id !== exerciseId) };
    });
  }, []);

  const updateSetValue = useCallback(
    (exerciseId: string, setId: string, field: "kg" | "reps", value: number): void => {
      setWorkout((current) => {
        if (!current) return current;
        return {
          ...current,
          exercises: current.exercises.map((e) => {
            if (e.id !== exerciseId) return e;
            return {
              ...e,
              sets: e.sets.map((s) =>
                s.id === setId ? { ...s, [field]: sanitizeNumber(value) } : s
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
      if (!current) return current;
      return {
        ...current,
        exercises: current.exercises.map((e) => {
          if (e.id !== exerciseId) return e;
          return {
            ...e,
            sets: e.sets.map((s) => (s.id === setId ? { ...s, completed: !s.completed } : s)),
          };
        }),
      };
    });
  }, []);

  const removeSet = useCallback((exerciseId: string, setId: string): void => {
    setWorkout((current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: current.exercises.map((e) => {
          if (e.id !== exerciseId || e.sets.length === 1) return e;
          return { ...e, sets: e.sets.filter((s) => s.id !== setId) };
        }),
      };
    });
  }, []);

  const addSetRow = useCallback((exerciseId: string): void => {
    setWorkout((current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: current.exercises.map((e) => {
          if (e.id !== exerciseId) return e;
          const last = e.sets[e.sets.length - 1] ?? null;
          return { ...e, sets: [...e.sets, makeSet(last)] };
        }),
      };
    });
  }, []);

  const cycleSetType = useCallback((exerciseId: string, setId: string): void => {
    setWorkout((current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: current.exercises.map((e) => {
          if (e.id !== exerciseId) return e;
          return {
            ...e,
            sets: e.sets.map((s) => {
              if (s.id !== setId) return s;
              const idx = SET_TYPE_ORDER.indexOf(s.type);
              return { ...s, type: SET_TYPE_ORDER[(idx + 1) % SET_TYPE_ORDER.length] };
            }),
          };
        }),
      };
    });
  }, []);

  // ── Context value ─────────────────────────────────────────────────────────────

  const value = useMemo<WorkoutLoggerContextValue>(
    () => ({
      selectedDate,
      setSelectedDate,
      calendarDays,
      workoutsForSelectedDate,
      routineTemplates: ROUTINES,
      exerciseLibrary: EXERCISE_LIBRARY,
      workout,
      timerElapsedSec,
      timerRunning,
      isLoaded,
      weeklyStats,
      lastCompletedWorkout,
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
      markSickDay,
      undoSickDay,
      moveWorkout,
      switchRoutineOnDate,
    }),
    [
      selectedDate, setSelectedDate, calendarDays, workoutsForSelectedDate,
      workout, timerElapsedSec, timerRunning, isLoaded, weeklyStats, lastCompletedWorkout,
      startTimer, stopTimer, toggleTimer, setWorkoutScreenActive,
      ensureWorkout, startBlankWorkout, startRoutineWorkout, startWorkoutFromCalendarEntry,
      finishWorkout, discardWorkout,
      addExercisesToWorkout, updateExerciseNotes, removeExercise, updateSetValue,
      toggleSetCompleted, removeSet, addSetRow, cycleSetType,
      markSickDay, undoSickDay, moveWorkout, switchRoutineOnDate,
    ]
  );

  return <WorkoutLoggerContext.Provider value={value}>{children}</WorkoutLoggerContext.Provider>;
}

export function useWorkoutLogger(): WorkoutLoggerContextValue {
  const context = useContext(WorkoutLoggerContext);
  if (!context) throw new Error("useWorkoutLogger must be used within WorkoutLoggerProvider");
  return context;
}
