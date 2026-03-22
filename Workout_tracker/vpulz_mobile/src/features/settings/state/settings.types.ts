export type FitnessGoal = 'hypertrophy' | 'strength' | 'fat_loss';
export type TrainingSplit = 'ppl' | 'full_body' | 'custom';
export type WeightUnit = 'kg' | 'lbs';
export type ThemeMode = 'dark' | 'light';
export type Language = 'en' | 'es' | 'de' | 'fr';
export type SubscriptionTier = 'free' | 'premium';

export type ProfileSettings = {
  name: string;
  age: string;
  heightCm: string;
  weightKg: string;
  gender: string;
  profileImageUrl: string;
  fitnessLevel: string;
};

export type GoalPreferencesSettings = {
  goal: FitnessGoal;
  trainingSplit: TrainingSplit;
  workoutDaysPerWeek: number;
  preferredMuscleGroups: string[];
};

export type WorkoutSettings = {
  defaultRestTimerSec: number;
  autoStartRestTimer: boolean;
  units: WeightUnit;
  autoSaveWorkouts: boolean;
  warmupSetsEnabled: boolean;
  prTrackingEnabled: boolean;
  advancedRpeEnabled: boolean;
  advancedTempoEnabled: boolean;
  advancedSupersetsEnabled: boolean;
  adaptiveRestTimerEnabled: boolean;
};

export type NotificationSettings = {
  workoutReminders: boolean;
  streakNotifications: boolean;
  prAlerts: boolean;
};

export type IntegrationSettings = {
  appleHealthConnected: boolean;
  googleFitConnected: boolean;
  wearableSyncEnabled: boolean;
};

export type AppSettings = {
  themeMode: ThemeMode;
  language: Language;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
};

export type PrivacySecuritySettings = {
  canExportData: boolean;
  deleteAccountRequested: boolean;
};

export type PremiumSettings = {
  tier: SubscriptionTier;
};

export type SmartFeaturesSettings = {
  aiWorkoutPreferencesEnabled: boolean;
  analyticsIntegrationReady: boolean;
};

export type CalendarDayState = 'planned' | 'sick';

export type CalendarSettings = {
  allowSickDays: boolean;
  trainingPlan: TrainingSplit;
  customRoutines: string[];
  entries: Record<string, CalendarDayState>;
  planOverrides: Record<string, string>;
  exerciseOverrides: Record<string, string[]>;
};

export type OnboardingSettings = {
  completed: boolean;
  selectedPlan: TrainingSplit;
};

export type SettingsState = {
  profile: ProfileSettings;
  goals: GoalPreferencesSettings;
  workout: WorkoutSettings;
  calendar: CalendarSettings;
  notifications: NotificationSettings;
  integrations: IntegrationSettings;
  app: AppSettings;
  privacy: PrivacySecuritySettings;
  premium: PremiumSettings;
  smart: SmartFeaturesSettings;
  onboarding: OnboardingSettings;
};

export const DEFAULT_SETTINGS: SettingsState = {
  profile: {
    name: 'Athlete',
    age: '',
    heightCm: '',
    weightKg: '',
    gender: '',
    profileImageUrl: '',
    fitnessLevel: 'intermediate',
  },
  goals: {
    goal: 'hypertrophy',
    trainingSplit: 'ppl',
    workoutDaysPerWeek: 4,
    preferredMuscleGroups: ['chest', 'back'],
  },
  workout: {
    defaultRestTimerSec: 90,
    autoStartRestTimer: true,
    units: 'kg',
    autoSaveWorkouts: true,
    warmupSetsEnabled: true,
    prTrackingEnabled: true,
    advancedRpeEnabled: true,
    advancedTempoEnabled: false,
    advancedSupersetsEnabled: true,
    adaptiveRestTimerEnabled: false,
  },
  calendar: {
    allowSickDays: true,
    trainingPlan: 'ppl',
    customRoutines: ['Custom Session'],
    entries: {},
    planOverrides: {},
    exerciseOverrides: {},
  },
  notifications: {
    workoutReminders: true,
    streakNotifications: true,
    prAlerts: true,
  },
  integrations: {
    appleHealthConnected: false,
    googleFitConnected: false,
    wearableSyncEnabled: false,
  },
  app: {
    themeMode: 'dark',
    language: 'en',
    hapticsEnabled: true,
    soundEnabled: true,
  },
  privacy: {
    canExportData: true,
    deleteAccountRequested: false,
  },
  premium: {
    tier: 'free',
  },
  smart: {
    aiWorkoutPreferencesEnabled: true,
    analyticsIntegrationReady: false,
  },
  onboarding: {
    completed: false,
    selectedPlan: 'ppl',
  },
};
