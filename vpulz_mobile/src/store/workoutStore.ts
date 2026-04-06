import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  CalendarItem,
  CalendarItemType,
  Exercise,
  Routine,
  SplitDay,
  TrainingSplit,
  TrainingSplitDayAssignment,
  Workout,
  WorkoutExercise,
  WorkoutHistoryEntry,
  WorkoutSession,
  WorkoutSet,
  WorkoutSplit,
  WorkoutTemplate,
} from '../types/workout';

const STORAGE_KEY = 'vpulz.workout.store.v2';
const CALENDAR_PREVIEW_DAYS = 30;
const WEEK_DAYS: SplitDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DAY_INDEX_TO_SPLIT: Record<number, SplitDay> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
};

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function pickSplitFromName(name: string): WorkoutSplit {
  const normalized = name.trim().toLowerCase();
  if (normalized.includes('leg')) {
    return 'legs';
  }
  if (normalized.includes('arm')) {
    return 'arms';
  }
  if (normalized.includes('back')) {
    return 'back';
  }
  return 'chest';
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function toDateKey(input: Date | string): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) {
    const fallback = new Date();
    return `${fallback.getFullYear()}-${pad(fallback.getMonth() + 1)}-${pad(fallback.getDate())}`;
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateKey(dateKey: string): Date {
  const [yearRaw, monthRaw, dayRaw] = dateKey.split('-');
  const year = Number.parseInt(yearRaw, 10);
  const month = Number.parseInt(monthRaw, 10);
  const day = Number.parseInt(dayRaw, 10);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return new Date();
  }

  return new Date(year, Math.max(0, month - 1), day);
}

function createSet(seed?: Partial<WorkoutSet>): WorkoutSet {
  return {
    id: makeId('set'),
    reps: seed?.reps ?? 8,
    weight: seed?.weight ?? 20,
    completed: seed?.completed ?? false,
    note: seed?.note ?? '',
  };
}

function createExercise(payload: {
  name: string;
  wgerExerciseId?: string;
  muscles?: string[];
  equipment?: string[];
  notes?: string;
}): WorkoutExercise {
  return {
    id: makeId('exercise'),
    wgerExerciseId: payload.wgerExerciseId,
    name: payload.name,
    notes: payload.notes ?? '',
    muscles: payload.muscles ?? [],
    equipment: payload.equipment ?? [],
    expanded: true,
    sets: [createSet()],
  };
}

function createWorkoutTemplate(name: string, split?: WorkoutSplit): WorkoutTemplate {
  const createdAt = nowIso();
  return {
    id: makeId('workout'),
    split: split ?? pickSplitFromName(name),
    name,
    notes: '',
    exercises: [],
    createdAt,
    updatedAt: createdAt,
  };
}

function createSeedWorkout(): WorkoutTemplate {
  const workout = createWorkoutTemplate('Chest Starter', 'chest');
  workout.exercises = [
    {
      ...createExercise({
        name: 'Barbell Back Squat',
        muscles: ['Quads', 'Glutes'],
        equipment: ['Barbell'],
      }),
      sets: [
        createSet({ reps: 5, weight: 60 }),
        createSet({ reps: 5, weight: 60 }),
        createSet({ reps: 5, weight: 60 }),
      ],
    },
    {
      ...createExercise({
        name: 'Bench Press',
        muscles: ['Chest', 'Triceps'],
        equipment: ['Barbell'],
      }),
      sets: [createSet({ reps: 8, weight: 40 }), createSet({ reps: 8, weight: 40 })],
    },
  ];
  workout.updatedAt = nowIso();
  return workout;
}

function summarizeSets(sets: WorkoutSet[]): { sets: number; reps: number; weight: number } {
  if (!sets.length) {
    return { sets: 0, reps: 0, weight: 0 };
  }

  const reps = sets.reduce((acc, setItem) => acc + setItem.reps, 0) / sets.length;
  const weight = sets.reduce((acc, setItem) => acc + setItem.weight, 0) / sets.length;

  return {
    sets: sets.length,
    reps: Math.round(reps),
    weight: Math.round(weight * 10) / 10,
  };
}

function toLoggedWorkout(workout: WorkoutTemplate, completedAtIso: string): Workout {
  const dateKey = toDateKey(completedAtIso);
  return {
    id: `${workout.id}-${dateKey}-${Math.random().toString(36).slice(2, 6)}`,
    date: dateKey,
    split: workout.split,
    exercises: workout.exercises.map((exercise) => {
      const summary = summarizeSets(exercise.sets);
      return {
        id: exercise.id,
        name: exercise.name,
        sets: summary.sets,
        reps: summary.reps,
        weight: summary.weight,
      };
    }),
  };
}

function normalizeWorkoutTemplate(workout: WorkoutTemplate): WorkoutTemplate {
  return {
    ...workout,
    split: workout.split ?? pickSplitFromName(workout.name),
  };
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
  const next = [...items];
  const [picked] = next.splice(from, 1);
  next.splice(to, 0, picked);
  return next;
}

function getWorkoutSetCounts(workout: WorkoutTemplate): { total: number; completed: number } {
  let total = 0;
  let completed = 0;

  workout.exercises.forEach((exercise) => {
    total += exercise.sets.length;
    completed += exercise.sets.filter((setItem) => setItem.completed).length;
  });

  return { total, completed };
}

function buildSplitCalendarItems(splits: TrainingSplit[], previewDays = CALENDAR_PREVIEW_DAYS): CalendarItem[] {
  const activeSplit = splits[0];
  if (!activeSplit) {
    return [];
  }

  const rows: CalendarItem[] = [];
  const start = new Date();

  for (let index = 0; index < previewDays; index += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + index);

    const splitDay = DAY_INDEX_TO_SPLIT[current.getDay()] ?? 'Mon';
    const assignment = activeSplit.days.find((day) => day.day === splitDay);
    if (!assignment?.workoutId) {
      continue;
    }

    const date = toDateKey(current);
    rows.push({
      id: `split-${activeSplit.id}-${date}-${assignment.workoutId}`,
      date,
      workoutId: assignment.workoutId,
      type: 'split',
    });
  }

  return rows;
}

function sortCalendar(items: CalendarItem[]): CalendarItem[] {
  return [...items].sort((a, b) => {
    if (a.date === b.date) {
      return a.workoutId.localeCompare(b.workoutId);
    }
    return a.date.localeCompare(b.date);
  });
}

function dedupeCalendar(items: CalendarItem[]): CalendarItem[] {
  const map = new Map<string, CalendarItem>();

  items.forEach((item) => {
    const key = `${item.date}|${item.workoutId}|${item.type}`;
    if (!map.has(key)) {
      map.set(key, item);
    }
  });

  return Array.from(map.values());
}

function keepValidCalendar(items: CalendarItem[], workouts: WorkoutTemplate[]): CalendarItem[] {
  const knownWorkoutIds = new Set(workouts.map((workout) => workout.id));
  return items.filter((item) => knownWorkoutIds.has(item.workoutId));
}

function rebuildCalendarFromState(
  state: Pick<WorkoutStoreState, 'calendar' | 'splits' | 'workouts'>,
  previewDays = CALENDAR_PREVIEW_DAYS
): CalendarItem[] {
  const manualAndRoutine = state.calendar.filter((item) => item.type !== 'split');
  const generatedSplitItems = buildSplitCalendarItems(state.splits, previewDays);

  const merged = dedupeCalendar([...manualAndRoutine, ...generatedSplitItems]);
  return sortCalendar(keepValidCalendar(merged, state.workouts));
}

function makeSessionFromWorkout(workout: WorkoutTemplate, startedAt: string): WorkoutSession {
  const counts = getWorkoutSetCounts(workout);

  return {
    id: makeId('session'),
    workoutId: workout.id,
    workoutName: workout.name,
    startedAt,
    endedAt: null,
    durationSec: 0,
    totalSets: counts.total,
    completedSets: counts.completed,
    status: 'active',
  };
}

export type AddExercisePayload = {
  workoutId: string;
  name: string;
  wgerExerciseId?: string;
  muscles?: string[];
  equipment?: string[];
  notes?: string;
};

export type UpdateWorkoutPayload = Partial<Pick<WorkoutTemplate, 'name' | 'notes' | 'exercises' | 'split'>>;

type UpdateSetPayload = Partial<Pick<WorkoutSet, 'reps' | 'weight' | 'completed' | 'note'>>;

type CreateSplitPayload = {
  name: string;
  days: TrainingSplitDayAssignment[];
};

type PersistedWorkoutStoreState = Pick<
  WorkoutStoreState,
  | 'workouts'
  | 'workoutLog'
  | 'routines'
  | 'splits'
  | 'sessions'
  | 'calendar'
  | 'history'
  | 'activeWorkoutId'
  | 'activeSessionId'
  | 'sessionStartedAt'
  | 'isWorkoutMinimized'
>;

export type WorkoutStoreState = {
  workouts: WorkoutTemplate[];
  workoutLog: Workout[];
  routines: Routine[];
  splits: TrainingSplit[];
  sessions: WorkoutSession[];
  calendar: CalendarItem[];
  history: WorkoutHistoryEntry[];
  activeWorkoutId: string | null;
  activeSessionId: string | null;
  sessionStartedAt: string | null;
  isWorkoutMinimized: boolean;
  createWorkout: (name: string) => string;
  updateWorkout: (workoutId: string, patch: UpdateWorkoutPayload) => void;
  setWorkoutSplit: (workoutId: string, split: WorkoutSplit) => void;
  updateWorkoutName: (workoutId: string, name: string) => void;
  setWorkoutNotes: (workoutId: string, notes: string) => void;
  deleteWorkout: (workoutId: string) => void;
  addExercise: (payload: AddExercisePayload) => void;
  removeExercise: (workoutId: string, exerciseId: string) => void;
  toggleExerciseExpanded: (workoutId: string, exerciseId: string) => void;
  reorderExercise: (workoutId: string, from: number, to: number) => void;
  setExerciseNotes: (workoutId: string, exerciseId: string, notes: string) => void;
  addSet: (workoutId: string, exerciseId: string) => void;
  updateSet: (workoutId: string, exerciseId: string, setId: string, patch: UpdateSetPayload) => void;
  removeSet: (workoutId: string, exerciseId: string, setId: string) => void;
  startWorkout: (workoutId?: string) => void;
  finishWorkout: () => WorkoutHistoryEntry | null;
  setActiveWorkout: (workoutId: string | null) => void;
  minimizeWorkout: () => void;
  restoreWorkout: () => void;
  createRoutine: (name: string, workoutIds: string[]) => string;
  setRoutineWorkouts: (routineId: string, workoutIds: string[]) => void;
  deleteRoutine: (routineId: string) => void;
  createSplit: (payload: CreateSplitPayload) => string;
  assignSplitDay: (splitId: string, day: SplitDay, workoutId: string | null) => void;
  deleteSplit: (splitId: string) => void;
  scheduleWorkoutOnDate: (date: string, workoutId: string, type?: CalendarItemType) => string;
  removeCalendarItem: (calendarItemId: string) => void;
  regenerateCalendar: (previewDays?: number) => void;
  getWorkoutsByDate: (date: string) => Workout[];
  getWorkoutById: (workoutId: string) => WorkoutTemplate | null;
  upsertWorkoutFromPreview: (workout: WorkoutTemplate) => void;
};

const seedWorkout = createSeedWorkout();

function addDays(base: Date, days: number): Date {
  const copy = new Date(base);
  copy.setDate(copy.getDate() + days);
  return copy;
}

const seededNow = new Date();
const seededYesterdayIso = addDays(seededNow, -1).toISOString();
const seededTomorrowDate = toDateKey(addDays(seededNow, 1));
const seedLoggedWorkout = toLoggedWorkout(seedWorkout, seededYesterdayIso);
const seedHistoryEntry: WorkoutHistoryEntry = {
  id: makeId('history-seed'),
  workoutId: seedWorkout.id,
  workoutName: seedWorkout.name,
  split: seedWorkout.split,
  durationSec: 42 * 60,
  completedAt: seededYesterdayIso,
  exerciseCount: seedWorkout.exercises.length,
  setCount: seedWorkout.exercises.reduce((acc, item) => acc + item.sets.length, 0),
};
const seedCalendarItems: CalendarItem[] = [
  {
    id: makeId('calendar-seed'),
    date: seededTomorrowDate,
    workoutId: seedWorkout.id,
    type: 'manual',
  },
];

const initialState: Pick<
  WorkoutStoreState,
  | 'workouts'
  | 'workoutLog'
  | 'routines'
  | 'splits'
  | 'sessions'
  | 'calendar'
  | 'history'
  | 'activeWorkoutId'
  | 'activeSessionId'
  | 'sessionStartedAt'
  | 'isWorkoutMinimized'
> = {
  workouts: [seedWorkout],
  workoutLog: [seedLoggedWorkout],
  routines: [],
  splits: [],
  sessions: [],
  calendar: seedCalendarItems,
  history: [seedHistoryEntry],
  activeWorkoutId: null,
  activeSessionId: null,
  sessionStartedAt: null,
  isWorkoutMinimized: false,
};

export const useWorkoutStore = create<WorkoutStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      createWorkout: (name) => {
        const trimmed = name.trim();
        const workout = createWorkoutTemplate(trimmed.length ? trimmed : 'New Workout');
        set((state) => ({
          workouts: [workout, ...state.workouts],
        }));
        return workout.id;
      },

      updateWorkout: (workoutId, patch) => {
        set((state) => ({
          workouts: state.workouts.map((workout) => {
            if (workout.id !== workoutId) {
              return workout;
            }

            const nextName =
              typeof patch.name === 'string' && patch.name.trim().length ? patch.name.trim() : workout.name;

            return {
              ...workout,
              name: nextName,
              notes: typeof patch.notes === 'string' ? patch.notes : workout.notes,
              exercises: Array.isArray(patch.exercises) ? patch.exercises : workout.exercises,
              split: patch.split ?? workout.split,
              updatedAt: nowIso(),
            };
          }),
        }));
      },

      setWorkoutSplit: (workoutId, split) => {
        get().updateWorkout(workoutId, { split });
      },

      updateWorkoutName: (workoutId, name) => {
        get().updateWorkout(workoutId, { name });
      },

      setWorkoutNotes: (workoutId, notes) => {
        get().updateWorkout(workoutId, { notes });
      },

      deleteWorkout: (workoutId) => {
        set((state) => {
          const nextWorkouts = state.workouts.filter((workout) => workout.id !== workoutId);
          const activeRemoved = state.activeWorkoutId === workoutId;

          const nextRoutines = state.routines.map((routine) => ({
            ...routine,
            workoutIds: routine.workoutIds.filter((id) => id !== workoutId),
            updatedAt: nowIso(),
          }));

          const nextSplits = state.splits.map((split) => ({
            ...split,
            days: split.days.map((assignment) =>
              assignment.workoutId === workoutId ? { ...assignment, workoutId: null } : assignment
            ),
            updatedAt: nowIso(),
          }));

          const fallbackWorkouts = nextWorkouts.length ? nextWorkouts : [createSeedWorkout()];

          const nextState = {
            ...state,
            workouts: fallbackWorkouts,
            workoutLog: state.workoutLog.filter((entry) => !entry.id.startsWith(`${workoutId}-`)),
            routines: nextRoutines,
            splits: nextSplits,
            sessions: state.sessions.filter((session) => session.workoutId !== workoutId || session.status === 'finished'),
            activeWorkoutId: activeRemoved ? null : state.activeWorkoutId,
            activeSessionId: activeRemoved ? null : state.activeSessionId,
            sessionStartedAt: activeRemoved ? null : state.sessionStartedAt,
          };

          return {
            ...nextState,
            calendar: rebuildCalendarFromState(nextState),
          };
        });
      },

      addExercise: (payload) => {
        set((state) => ({
          workouts: state.workouts.map((workout) =>
            workout.id === payload.workoutId
              ? {
                  ...workout,
                  exercises: [
                    ...workout.exercises,
                    createExercise({
                      name: payload.name,
                      wgerExerciseId: payload.wgerExerciseId,
                      muscles: payload.muscles,
                      equipment: payload.equipment,
                      notes: payload.notes,
                    }),
                  ],
                  updatedAt: nowIso(),
                }
              : workout
          ),
        }));
      },

      removeExercise: (workoutId, exerciseId) => {
        set((state) => ({
          workouts: state.workouts.map((workout) =>
            workout.id === workoutId
              ? {
                  ...workout,
                  exercises: workout.exercises.filter((exercise) => exercise.id !== exerciseId),
                  updatedAt: nowIso(),
                }
              : workout
          ),
        }));
      },

      toggleExerciseExpanded: (workoutId, exerciseId) => {
        set((state) => ({
          workouts: state.workouts.map((workout) =>
            workout.id === workoutId
              ? {
                  ...workout,
                  exercises: workout.exercises.map((exercise) =>
                    exercise.id === exerciseId ? { ...exercise, expanded: !exercise.expanded } : exercise
                  ),
                  updatedAt: nowIso(),
                }
              : workout
          ),
        }));
      },

      reorderExercise: (workoutId, from, to) => {
        set((state) => ({
          workouts: state.workouts.map((workout) =>
            workout.id === workoutId
              ? {
                  ...workout,
                  exercises: moveItem(workout.exercises, from, to),
                  updatedAt: nowIso(),
                }
              : workout
          ),
        }));
      },

      setExerciseNotes: (workoutId, exerciseId, notes) => {
        set((state) => ({
          workouts: state.workouts.map((workout) =>
            workout.id === workoutId
              ? {
                  ...workout,
                  exercises: workout.exercises.map((exercise) =>
                    exercise.id === exerciseId ? { ...exercise, notes } : exercise
                  ),
                  updatedAt: nowIso(),
                }
              : workout
          ),
        }));
      },

      addSet: (workoutId, exerciseId) => {
        set((state) => ({
          workouts: state.workouts.map((workout) =>
            workout.id === workoutId
              ? {
                  ...workout,
                  exercises: workout.exercises.map((exercise) => {
                    if (exercise.id !== exerciseId) {
                      return exercise;
                    }

                    const last = exercise.sets[exercise.sets.length - 1];
                    return {
                      ...exercise,
                      sets: [
                        ...exercise.sets,
                        createSet({
                          reps: last?.reps ?? 8,
                          weight: last?.weight ?? 20,
                        }),
                      ],
                    };
                  }),
                  updatedAt: nowIso(),
                }
              : workout
          ),
        }));
      },

      updateSet: (workoutId, exerciseId, setId, patch) => {
        set((state) => ({
          workouts: state.workouts.map((workout) =>
            workout.id === workoutId
              ? {
                  ...workout,
                  exercises: workout.exercises.map((exercise) =>
                    exercise.id === exerciseId
                      ? {
                          ...exercise,
                          sets: exercise.sets.map((setItem) => {
                            if (setItem.id !== setId) {
                              return setItem;
                            }

                            return {
                              ...setItem,
                              ...patch,
                              reps: typeof patch.reps === 'number' ? Math.max(0, patch.reps) : setItem.reps,
                              weight:
                                typeof patch.weight === 'number' ? Math.max(0, patch.weight) : setItem.weight,
                            };
                          }),
                        }
                      : exercise
                  ),
                  updatedAt: nowIso(),
                }
              : workout
          ),
        }));
      },

      removeSet: (workoutId, exerciseId, setId) => {
        set((state) => ({
          workouts: state.workouts.map((workout) =>
            workout.id === workoutId
              ? {
                  ...workout,
                  exercises: workout.exercises.map((exercise) => {
                    if (exercise.id !== exerciseId) {
                      return exercise;
                    }

                    const nextSets = exercise.sets.filter((setItem) => setItem.id !== setId);
                    return {
                      ...exercise,
                      sets: nextSets.length ? nextSets : [createSet()],
                    };
                  }),
                  updatedAt: nowIso(),
                }
              : workout
          ),
        }));
      },

      startWorkout: (workoutId) => {
        const state = get();
        const targetWorkoutId = workoutId ?? state.activeWorkoutId ?? state.workouts[0]?.id ?? null;
        if (!targetWorkoutId) {
          return;
        }

        const workout = state.workouts.find((item) => item.id === targetWorkoutId);
        if (!workout) {
          return;
        }

        const activeSession =
          state.activeSessionId != null
            ? state.sessions.find((session) => session.id === state.activeSessionId)
            : null;

        if (activeSession && activeSession.status === 'active' && activeSession.workoutId === targetWorkoutId) {
          set({
            activeWorkoutId: targetWorkoutId,
            sessionStartedAt: activeSession.startedAt,
            isWorkoutMinimized: false,
          });
          return;
        }

        const startedAt = nowIso();
        const createdSession = makeSessionFromWorkout(workout, startedAt);

        set((current) => {
          const sessions = current.sessions.map((session) => {
            if (session.id !== current.activeSessionId || session.status !== 'active') {
              return session;
            }

            return {
              ...session,
              status: 'finished' as const,
              endedAt: startedAt,
              durationSec: Math.max(0, Math.floor((Date.parse(startedAt) - Date.parse(session.startedAt)) / 1000)),
            };
          });

          return {
            sessions: [createdSession, ...sessions].slice(0, 220),
            activeWorkoutId: targetWorkoutId,
            activeSessionId: createdSession.id,
            sessionStartedAt: startedAt,
            isWorkoutMinimized: false,
          };
        });
      },

      finishWorkout: () => {
        const state = get();
        const activeWorkoutId = state.activeWorkoutId;
        const activeSessionId = state.activeSessionId;

        if (!activeWorkoutId || !state.sessionStartedAt || !activeSessionId) {
          return null;
        }

        const workout = state.workouts.find((item) => item.id === activeWorkoutId);
        if (!workout) {
          return null;
        }

        const completedAt = nowIso();
        const durationSec = Math.max(0, Math.floor((Date.parse(completedAt) - Date.parse(state.sessionStartedAt)) / 1000));
        const counts = getWorkoutSetCounts(workout);
        const loggedWorkout = toLoggedWorkout(workout, completedAt);

        const historyEntry: WorkoutHistoryEntry = {
          id: makeId('history'),
          workoutId: workout.id,
          workoutName: workout.name,
          split: workout.split,
          durationSec,
          completedAt,
          exerciseCount: workout.exercises.length,
          setCount: counts.total,
        };

        set((current) => ({
          sessions: current.sessions.map((session) =>
            session.id === activeSessionId
              ? {
                  ...session,
                  workoutName: workout.name,
                  endedAt: completedAt,
                  durationSec,
                  totalSets: counts.total,
                  completedSets: counts.completed,
                  status: 'finished',
                }
              : session
          ),
          history: [historyEntry, ...current.history].slice(0, 180),
          workoutLog: [loggedWorkout, ...current.workoutLog].slice(0, 240),
          activeWorkoutId: null,
          activeSessionId: null,
          sessionStartedAt: null,
          isWorkoutMinimized: false,
        }));

        return historyEntry;
      },

      setActiveWorkout: (workoutId) => {
        const state = get();
        const hasWorkout = workoutId == null || state.workouts.some((workout) => workout.id === workoutId);
        if (!hasWorkout) {
          return;
        }

        set({
          activeWorkoutId: workoutId,
          sessionStartedAt: workoutId ? state.sessionStartedAt : null,
          activeSessionId: workoutId ? state.activeSessionId : null,
        });
      },

      minimizeWorkout: () => {
        set({ isWorkoutMinimized: true });
      },

      restoreWorkout: () => {
        set({ isWorkoutMinimized: false });
      },

      createRoutine: (name, workoutIds) => {
        const now = nowIso();
        const routine: Routine = {
          id: makeId('routine'),
          name: name.trim() || 'New Routine',
          workoutIds,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          routines: [routine, ...state.routines],
        }));

        return routine.id;
      },

      setRoutineWorkouts: (routineId, workoutIds) => {
        set((state) => ({
          routines: state.routines.map((routine) =>
            routine.id === routineId
              ? {
                  ...routine,
                  workoutIds,
                  updatedAt: nowIso(),
                }
              : routine
          ),
        }));
      },

      deleteRoutine: (routineId) => {
        set((state) => ({
          routines: state.routines.filter((routine) => routine.id !== routineId),
          calendar: state.calendar.filter((item) => item.type !== 'routine'),
        }));
      },

      createSplit: (payload) => {
        const now = nowIso();
        const normalizedDays = WEEK_DAYS.map((day) => {
          const found = payload.days.find((item) => item.day === day);
          return {
            day,
            workoutId: found?.workoutId ?? null,
          };
        });

        const split: TrainingSplit = {
          id: makeId('split'),
          name: payload.name.trim() || 'Training Split',
          days: normalizedDays,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => {
          const next = {
            ...state,
            splits: [split, ...state.splits],
          };

          return {
            splits: next.splits,
            calendar: rebuildCalendarFromState(next),
          };
        });

        return split.id;
      },

      assignSplitDay: (splitId, day, workoutId) => {
        set((state) => {
          const next = {
            ...state,
            splits: state.splits.map((split) =>
              split.id === splitId
                ? {
                    ...split,
                    days: split.days.map((assignment) =>
                      assignment.day === day ? { ...assignment, workoutId } : assignment
                    ),
                    updatedAt: nowIso(),
                  }
                : split
            ),
          };

          return {
            splits: next.splits,
            calendar: rebuildCalendarFromState(next),
          };
        });
      },

      deleteSplit: (splitId) => {
        set((state) => {
          const next = {
            ...state,
            splits: state.splits.filter((split) => split.id !== splitId),
          };

          return {
            splits: next.splits,
            calendar: rebuildCalendarFromState(next),
          };
        });
      },

      scheduleWorkoutOnDate: (date, workoutId, type = 'manual') => {
        const normalizedDate = toDateKey(parseDateKey(date));
        const itemId = makeId('calendar');

        set((state) => {
          const nextItem: CalendarItem = {
            id: itemId,
            date: normalizedDate,
            workoutId,
            type,
          };

          const items = dedupeCalendar([...state.calendar, nextItem]);
          return {
            calendar: sortCalendar(keepValidCalendar(items, state.workouts)),
          };
        });

        return itemId;
      },

      removeCalendarItem: (calendarItemId) => {
        set((state) => ({
          calendar: state.calendar.filter((item) => item.id !== calendarItemId),
        }));
      },

      regenerateCalendar: (previewDays = CALENDAR_PREVIEW_DAYS) => {
        set((state) => ({
          calendar: rebuildCalendarFromState(state, previewDays),
        }));
      },

      getWorkoutsByDate: (date) => {
        const key = toDateKey(parseDateKey(date));
        return get().workoutLog.filter((entry) => entry.date === key);
      },

      getWorkoutById: (workoutId) => {
        return get().workouts.find((workout) => workout.id === workoutId) ?? null;
      },

      upsertWorkoutFromPreview: (workout) => {
        set((state) => {
          const normalized = normalizeWorkoutTemplate(workout);
          const exists = state.workouts.some((item) => item.id === workout.id);
          const next = {
            ...state,
            workouts: exists
              ? state.workouts.map((item) =>
                  item.id === normalized.id ? { ...normalized, updatedAt: nowIso() } : item
                )
              : [{ ...normalized, updatedAt: nowIso() }, ...state.workouts],
          };

          return {
            workouts: next.workouts,
            calendar: keepValidCalendar(next.calendar, next.workouts),
          };
        });
      },
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): PersistedWorkoutStoreState => ({
        workouts: state.workouts,
        workoutLog: state.workoutLog,
        routines: state.routines,
        splits: state.splits,
        sessions: state.sessions,
        calendar: state.calendar,
        history: state.history,
        activeWorkoutId: state.activeWorkoutId,
        activeSessionId: state.activeSessionId,
        sessionStartedAt: state.sessionStartedAt,
        isWorkoutMinimized: state.isWorkoutMinimized,
      }),
      merge: (persisted, current) => {
        const input = (persisted as PersistedWorkoutStoreState | undefined) ?? undefined;
        const normalizedWorkouts = (input?.workouts?.length ? input.workouts : current.workouts).map(
          normalizeWorkoutTemplate
        );
        const merged: WorkoutStoreState = {
          ...current,
          workouts: normalizedWorkouts,
          workoutLog: Array.isArray(input?.workoutLog) ? input.workoutLog : current.workoutLog,
          routines: Array.isArray(input?.routines) ? input.routines : current.routines,
          splits: Array.isArray(input?.splits) ? input.splits : current.splits,
          sessions: Array.isArray(input?.sessions) ? input.sessions : current.sessions,
          calendar: Array.isArray(input?.calendar) ? input.calendar : current.calendar,
          history: Array.isArray(input?.history) ? input.history : current.history,
          activeWorkoutId: input?.activeWorkoutId ?? current.activeWorkoutId,
          activeSessionId: input?.activeSessionId ?? current.activeSessionId,
          sessionStartedAt: input?.sessionStartedAt ?? current.sessionStartedAt,
          isWorkoutMinimized: Boolean(input?.isWorkoutMinimized),
        };

        return {
          ...merged,
          calendar: rebuildCalendarFromState(merged),
        };
      },
    }
  )
);

export function getElapsedSeconds(sessionStartedAt: string | null): number {
  if (!sessionStartedAt) {
    return 0;
  }

  const diff = Date.now() - Date.parse(sessionStartedAt);
  if (!Number.isFinite(diff) || diff < 0) {
    return 0;
  }

  return Math.floor(diff / 1000);
}

export function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export function mapExerciseToStore(workoutId: string, exercise: Exercise): AddExercisePayload {
  return {
    workoutId,
    name: exercise.name,
    wgerExerciseId: exercise.id,
    muscles: exercise.muscles,
    equipment: exercise.equipment,
    notes: exercise.instructions,
  };
}