import AsyncStorage from '@react-native-async-storage/async-storage';

export type TrainingSplit = 'ppl' | 'full_body' | 'custom';

export type UserAppSettings = {
  trainingSplit: TrainingSplit;
  customSplitName: string;
  completedDates: Record<string, boolean>;
  plannedWorkoutOverrides: Record<string, string>;
  plannedExerciseOverrides: Record<string, string[]>;
};

const STORAGE_KEY = 'vpulz.user.settings.v1';

const DEFAULT_SETTINGS: UserAppSettings = {
  trainingSplit: 'ppl',
  customSplitName: 'Custom Session',
  completedDates: {},
  plannedWorkoutOverrides: {},
  plannedExerciseOverrides: {},
};

export async function loadUserAppSettings(): Promise<UserAppSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<UserAppSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      completedDates: { ...DEFAULT_SETTINGS.completedDates, ...(parsed.completedDates ?? {}) },
      plannedWorkoutOverrides: { ...DEFAULT_SETTINGS.plannedWorkoutOverrides, ...(parsed.plannedWorkoutOverrides ?? {}) },
      plannedExerciseOverrides: { ...DEFAULT_SETTINGS.plannedExerciseOverrides, ...(parsed.plannedExerciseOverrides ?? {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveUserAppSettings(settings: UserAppSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
