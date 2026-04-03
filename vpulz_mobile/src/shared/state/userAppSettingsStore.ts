import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserLevel = 'beginner' | 'intermediate' | 'advanced';
export type UserGoal = 'fat_loss' | 'muscle_gain' | 'maintenance';
export type TrainingType = 'full_body' | 'split' | 'push_pull_legs' | 'custom';
export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';
export type EquipmentType = 'gym' | 'home' | 'bodyweight';
export type WeightUnits = 'kg' | 'lbs';
export type AiCoachStyle = 'motivational' | 'strict' | 'neutral';
export type HistoryLimit = '30_days' | 'unlimited';
export type AppTheme = 'dark' | 'light';

export type UserAppSettings = {
  profile: {
    username: string;
    height_cm: number;
    weight_kg: number;
    level: UserLevel;
    goal: UserGoal;
  };
  splitConfig: {
    colors: {
      push: string;
      pull: string;
      legs: string;
    };
    customColors: Record<string, string>;
  };
  workout: {
    training_type: TrainingType;
    training_days: Weekday[];
    session_duration_min: number;
    equipment: EquipmentType;
    rest_timer_sec: number;
    units: WeightUnits;
  };
  ai_coach: {
    enabled: boolean;
    style: AiCoachStyle;
    adaptive_training: boolean;
    auto_progression: boolean;
    post_workout_feedback: boolean;
    fatigue_adjustment: boolean;
  };
  tracking: {
    log_weights: boolean;
    log_reps: boolean;
    log_sets: boolean;
    auto_save: boolean;
    track_prs: boolean;
    history_limit: HistoryLimit;
  };
  notifications: {
    workout_reminders: {
      enabled: boolean;
      time: string;
      days: Weekday[];
    };
    ai_suggestions: boolean;
    streak_alerts: boolean;
  };
  account: {
    email: string;
  };
  general: {
    language: string;
    theme: AppTheme;
    calendar_preview_days: number;
  };
};

export const onboarding = [
  'goal',
  'level',
  'equipment',
  'training_days',
  'session_duration',
] as const;

const STORAGE_KEY = 'vpulz.user.settings.v2';

const WEEKDAYS: Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const LEVELS: UserLevel[] = ['beginner', 'intermediate', 'advanced'];
const GOALS: UserGoal[] = ['fat_loss', 'muscle_gain', 'maintenance'];
const TRAINING_TYPES: TrainingType[] = ['full_body', 'split', 'push_pull_legs', 'custom'];
const EQUIPMENT_TYPES: EquipmentType[] = ['gym', 'home', 'bodyweight'];
const WEIGHT_UNITS: WeightUnits[] = ['kg', 'lbs'];
const COACH_STYLES: AiCoachStyle[] = ['motivational', 'strict', 'neutral'];
const HISTORY_LIMITS: HistoryLimit[] = ['30_days', 'unlimited'];
const APP_THEMES: AppTheme[] = ['dark', 'light'];

const DEFAULT_SETTINGS: UserAppSettings = {
  profile: {
    username: 'Athlete',
    height_cm: 180,
    weight_kg: 80,
    level: 'intermediate',
    goal: 'muscle_gain',
  },
  splitConfig: {
    colors: {
      push: '#FF6B6B',
      pull: '#7AB3FF',
      legs: '#A6FF7A',
    },
    customColors: {},
  },
  workout: {
    training_type: 'push_pull_legs',
    training_days: ['monday', 'wednesday', 'friday'],
    session_duration_min: 45,
    equipment: 'gym',
    rest_timer_sec: 90,
    units: 'kg',
  },
  ai_coach: {
    enabled: true,
    style: 'motivational',
    adaptive_training: true,
    auto_progression: true,
    post_workout_feedback: true,
    fatigue_adjustment: true,
  },
  tracking: {
    log_weights: true,
    log_reps: true,
    log_sets: true,
    auto_save: true,
    track_prs: true,
    history_limit: '30_days',
  },
  notifications: {
    workout_reminders: {
      enabled: true,
      time: '18:00',
      days: ['monday', 'wednesday', 'friday'],
    },
    ai_suggestions: true,
    streak_alerts: true,
  },
  account: {
    email: '',
  },
  general: {
    language: 'en',
    theme: 'dark',
    calendar_preview_days: 14,
  },
};

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return fallback;
}

function asOneOf<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  if (typeof value === 'string' && allowed.includes(value as T)) {
    return value as T;
  }
  return fallback;
}

function asWeekdayList(value: unknown, fallback: Weekday[]): Weekday[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const next = value.filter((item): item is Weekday => typeof item === 'string' && WEEKDAYS.includes(item as Weekday));
  return next.length ? next : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  return fallback;
}

function migrateLegacySettings(raw: unknown): Partial<UserAppSettings> {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const legacy = raw as Record<string, unknown>;
  const split = typeof legacy.trainingSplit === 'string' ? legacy.trainingSplit : '';
  const migratedTrainingType: TrainingType =
    split === 'ppl' ? 'push_pull_legs' : split === 'full_body' ? 'full_body' : split === 'custom' ? 'custom' : DEFAULT_SETTINGS.workout.training_type;

  return {
    workout: {
      ...DEFAULT_SETTINGS.workout,
      training_type: migratedTrainingType,
    },
  };
}

function normalizeSettings(raw: unknown): UserAppSettings {
  const migrated = migrateLegacySettings(raw);
  const parsed = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const profile = parsed.profile && typeof parsed.profile === 'object' ? (parsed.profile as Record<string, unknown>) : {};
  const workout = parsed.workout && typeof parsed.workout === 'object' ? (parsed.workout as Record<string, unknown>) : {};
  const aiCoach = parsed.ai_coach && typeof parsed.ai_coach === 'object' ? (parsed.ai_coach as Record<string, unknown>) : {};
  const tracking = parsed.tracking && typeof parsed.tracking === 'object' ? (parsed.tracking as Record<string, unknown>) : {};
  const notifications =
    parsed.notifications && typeof parsed.notifications === 'object'
      ? (parsed.notifications as Record<string, unknown>)
      : {};
  const workoutReminders =
    notifications.workout_reminders && typeof notifications.workout_reminders === 'object'
      ? (notifications.workout_reminders as Record<string, unknown>)
      : {};
  const account = parsed.account && typeof parsed.account === 'object' ? (parsed.account as Record<string, unknown>) : {};
  const general = parsed.general && typeof parsed.general === 'object' ? (parsed.general as Record<string, unknown>) : {};
  const splitConfig = parsed.splitConfig && typeof parsed.splitConfig === 'object' ? (parsed.splitConfig as Record<string, unknown>) : {};
  const splitColorsObj = splitConfig.colors && typeof splitConfig.colors === 'object' ? (splitConfig.colors as Record<string, unknown>) : {};
  const splitCustomColorsObj = splitConfig.customColors && typeof splitConfig.customColors === 'object' ? (splitConfig.customColors as Record<string, unknown>) : {};

  return {
    profile: {
      username: asString(profile.username, DEFAULT_SETTINGS.profile.username),
      height_cm: asNumber(profile.height_cm, DEFAULT_SETTINGS.profile.height_cm),
      weight_kg: asNumber(profile.weight_kg, DEFAULT_SETTINGS.profile.weight_kg),
      level: asOneOf(profile.level, LEVELS, DEFAULT_SETTINGS.profile.level),
      goal: asOneOf(profile.goal, GOALS, DEFAULT_SETTINGS.profile.goal),
    },
    workout: {
      training_type: asOneOf(
        workout.training_type ?? migrated.workout?.training_type,
        TRAINING_TYPES,
        DEFAULT_SETTINGS.workout.training_type
      ),
      training_days: asWeekdayList(workout.training_days, DEFAULT_SETTINGS.workout.training_days),
      session_duration_min: asNumber(workout.session_duration_min, DEFAULT_SETTINGS.workout.session_duration_min),
      equipment: asOneOf(workout.equipment, EQUIPMENT_TYPES, DEFAULT_SETTINGS.workout.equipment),
      rest_timer_sec: asNumber(workout.rest_timer_sec, DEFAULT_SETTINGS.workout.rest_timer_sec),
      units: asOneOf(workout.units, WEIGHT_UNITS, DEFAULT_SETTINGS.workout.units),
    },
    ai_coach: {
      enabled: asBoolean(aiCoach.enabled, DEFAULT_SETTINGS.ai_coach.enabled),
      style: asOneOf(aiCoach.style, COACH_STYLES, DEFAULT_SETTINGS.ai_coach.style),
      adaptive_training: asBoolean(aiCoach.adaptive_training, DEFAULT_SETTINGS.ai_coach.adaptive_training),
      auto_progression: asBoolean(aiCoach.auto_progression, DEFAULT_SETTINGS.ai_coach.auto_progression),
      post_workout_feedback: asBoolean(aiCoach.post_workout_feedback, DEFAULT_SETTINGS.ai_coach.post_workout_feedback),
      fatigue_adjustment: asBoolean(aiCoach.fatigue_adjustment, DEFAULT_SETTINGS.ai_coach.fatigue_adjustment),
    },
    tracking: {
      log_weights: asBoolean(tracking.log_weights, DEFAULT_SETTINGS.tracking.log_weights),
      log_reps: asBoolean(tracking.log_reps, DEFAULT_SETTINGS.tracking.log_reps),
      log_sets: asBoolean(tracking.log_sets, DEFAULT_SETTINGS.tracking.log_sets),
      auto_save: asBoolean(tracking.auto_save, DEFAULT_SETTINGS.tracking.auto_save),
      track_prs: asBoolean(tracking.track_prs, DEFAULT_SETTINGS.tracking.track_prs),
      history_limit: asOneOf(tracking.history_limit, HISTORY_LIMITS, DEFAULT_SETTINGS.tracking.history_limit),
    },
    notifications: {
      workout_reminders: {
        enabled: asBoolean(workoutReminders.enabled, DEFAULT_SETTINGS.notifications.workout_reminders.enabled),
        time: asString(workoutReminders.time, DEFAULT_SETTINGS.notifications.workout_reminders.time),
        days: asWeekdayList(workoutReminders.days, DEFAULT_SETTINGS.notifications.workout_reminders.days),
      },
      ai_suggestions: asBoolean(notifications.ai_suggestions, DEFAULT_SETTINGS.notifications.ai_suggestions),
      streak_alerts: asBoolean(notifications.streak_alerts, DEFAULT_SETTINGS.notifications.streak_alerts),
    },
    account: {
      email: asString(account.email, DEFAULT_SETTINGS.account.email),
    },
    splitConfig: {
      colors: {
        push: asString(splitColorsObj.push, DEFAULT_SETTINGS.splitConfig.colors.push),
        pull: asString(splitColorsObj.pull, DEFAULT_SETTINGS.splitConfig.colors.pull),
        legs: asString(splitColorsObj.legs, DEFAULT_SETTINGS.splitConfig.colors.legs),
      },
      customColors: Object.keys(splitCustomColorsObj).reduce<Record<string, string>>((acc, key) => {
        const value = splitCustomColorsObj[key];
        if (typeof value === 'string' && value.trim()) {
          acc[key] = value.trim();
        }
        return acc;
      }, {}),
    },
    general: {
      language: asString(general.language, DEFAULT_SETTINGS.general.language),
      theme: asOneOf(general.theme, APP_THEMES, DEFAULT_SETTINGS.general.theme),
      calendar_preview_days: asNumber(general.calendar_preview_days, DEFAULT_SETTINGS.general.calendar_preview_days),
    },
  };
}

export async function loadUserAppSettings(): Promise<UserAppSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    return normalizeSettings(JSON.parse(raw) as unknown);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveUserAppSettings(settings: UserAppSettings): Promise<void> {
  const normalized = normalizeSettings(settings);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

export const defaultUserAppSettings: UserAppSettings = DEFAULT_SETTINGS;
