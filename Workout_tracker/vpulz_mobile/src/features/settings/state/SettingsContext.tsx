import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { loadSettings, saveSettings } from '../services/settingsStorage';
import { hasPremiumAccess, type PremiumFeature } from '../services/premiumService';
import {
  DEFAULT_SETTINGS,
  type Language,
  type SettingsState,
  type ThemeMode,
  type TrainingSplit,
} from './settings.types';
import { getAppColors } from '../../../shared/theme/appTheme';
import { translate } from '../../../shared/i18n/translations';
import { useAuth } from '../../../shared/auth/AuthContext';
import { pullUserData, pushSettings } from '../../../shared/sync/cloudSyncService';
import { generateTwoWeekPlan } from '../../progress/services/calendarPlan';

type SettingsContextValue = {
  settings: SettingsState;
  loaded: boolean;
  updateSettings: (updater: (current: SettingsState) => SettingsState) => void;
  setLanguage: (language: Language) => void;
  toggleTheme: () => void;
  themeMode: ThemeMode;
  colors: ReturnType<typeof getAppColors>;
  t: (key: string) => string;
  isPremiumFeatureAvailable: (feature: PremiumFeature) => boolean;
  requestDeleteAccount: () => void;
  regenerateTrainingPlan: () => void;
  completeOnboarding: (plan: TrainingSplit) => void;
  addCustomRoutine: (name: string) => void;
  removeCustomRoutine: (name: string) => void;
  updatePlannedWorkout: (isoDate: string, workoutName: string) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;
    void loadSettings().then((value) => {
      if (!mounted) {
        return;
      }
      setSettings(value);
      setLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }
    void saveSettings(settings).catch(() => undefined);
  }, [loaded, settings]);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    const hasEntries = Object.keys(settings.calendar.entries).length > 0;
    if (hasEntries) {
      return;
    }

    const generated = generateTwoWeekPlan(
      settings.calendar.trainingPlan,
      settings.goals.workoutDaysPerWeek,
      settings.calendar.customRoutines
    );
    setSettings((current) => ({
      ...current,
      calendar: {
        ...current.calendar,
        entries: generated.entries,
        planOverrides: generated.planOverrides,
      },
    }));
  }, [
    loaded,
    settings.calendar.customRoutines,
    settings.calendar.entries,
    settings.calendar.trainingPlan,
    settings.goals.workoutDaysPerWeek,
  ]);

  useEffect(() => {
    if (!loaded || !user?.id) {
      return;
    }

    let mounted = true;
    void pullUserData(user.id).then(({ settings: cloudSettings }) => {
      if (!mounted || !cloudSettings) {
        return;
      }
      setSettings((current) => ({
        ...current,
        ...cloudSettings,
        profile: { ...current.profile, ...(cloudSettings.profile ?? {}) },
        goals: { ...current.goals, ...(cloudSettings.goals ?? {}) },
        workout: { ...current.workout, ...(cloudSettings.workout ?? {}) },
        calendar: { ...current.calendar, ...(cloudSettings.calendar ?? {}) },
        notifications: { ...current.notifications, ...(cloudSettings.notifications ?? {}) },
        integrations: { ...current.integrations, ...(cloudSettings.integrations ?? {}) },
        app: { ...current.app, ...(cloudSettings.app ?? {}) },
        privacy: { ...current.privacy, ...(cloudSettings.privacy ?? {}) },
        premium: { ...current.premium, ...(cloudSettings.premium ?? {}) },
        smart: { ...current.smart, ...(cloudSettings.smart ?? {}) },
        onboarding: { ...current.onboarding, ...(cloudSettings.onboarding ?? {}) },
      }));
    });

    return () => {
      mounted = false;
    };
  }, [loaded, user?.id]);

  useEffect(() => {
    if (!loaded || !user?.id) {
      return;
    }
    void pushSettings(user.id, settings).catch(() => undefined);
  }, [loaded, settings, user?.id]);

  const colors = useMemo(() => getAppColors(settings.app.themeMode), [settings.app.themeMode]);

  const PALETTE = ['#FF6B6B', '#FFB86B', '#FFD86B', '#7AB3FF', '#7AE1AB', '#D9A7FF'];

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      loaded,
      updateSettings: (updater) => {
        setSettings((current) => updater(current));
      },
      setLanguage: (language) => {
        setSettings((current) => ({
          ...current,
          app: { ...current.app, language },
        }));
      },
      toggleTheme: () => {
        setSettings((current) => ({
          ...current,
          app: { ...current.app, themeMode: current.app.themeMode === 'dark' ? 'light' : 'dark' },
        }));
      },
      themeMode: settings.app.themeMode,
      colors,
      t: (key) => translate(settings.app.language, key),
      isPremiumFeatureAvailable: (feature) => hasPremiumAccess(settings.premium.tier, feature),
      requestDeleteAccount: () => {
        setSettings((current) => ({
          ...current,
          privacy: { ...current.privacy, deleteAccountRequested: true },
        }));
      },
      regenerateTrainingPlan: () => {
        setSettings((current) => {
          const generated = generateTwoWeekPlan(
            current.calendar.trainingPlan,
            current.goals.workoutDaysPerWeek,
            current.calendar.customRoutines
          );
          return {
            ...current,
            calendar: {
              ...current.calendar,
              entries: generated.entries,
              planOverrides: generated.planOverrides,
            },
          };
        });
      },
      completeOnboarding: (plan) => {
        setSettings((current) => {
          const generated = generateTwoWeekPlan(plan, current.goals.workoutDaysPerWeek, current.calendar.customRoutines);
          return {
            ...current,
            goals: {
              ...current.goals,
              trainingSplit: plan,
            },
            calendar: {
              ...current.calendar,
              trainingPlan: plan,
              entries: generated.entries,
              planOverrides: generated.planOverrides,
            },
            onboarding: {
              completed: true,
              selectedPlan: plan,
            },
          };
        });
      },
      addCustomRoutine: (name) => {
        const cleanedName = name.trim();
        if (!cleanedName) {
          return;
        }

        setSettings((current) => {
          const exists = current.calendar.customRoutines.some(
            (item) => item.toLowerCase() === cleanedName.toLowerCase()
          );

          if (exists) {
            return current;
          }

          const customRoutines = [...current.calendar.customRoutines, cleanedName];
          const generated = generateTwoWeekPlan(
            current.calendar.trainingPlan,
            current.goals.workoutDaysPerWeek,
            customRoutines
          );

          const existingColors = current.calendar.routineColors ?? {};
          const used = Object.values(existingColors || []);
          const available = PALETTE.find((c) => !used.includes(c)) ?? PALETTE[customRoutines.length % PALETTE.length];
          const nextRoutineColors = { ...(current.calendar.routineColors ?? {}), [cleanedName]: available };

          return {
            ...current,
            calendar: {
              ...current.calendar,
              customRoutines,
              entries: generated.entries,
              planOverrides: generated.planOverrides,
              routineColors: nextRoutineColors,
            },
          };
        });
      },
      removeCustomRoutine: (name) => {
        setSettings((current) => {
          const customRoutines = current.calendar.customRoutines.filter(
            (item) => item.toLowerCase() !== name.toLowerCase()
          );

          const nextCustomRoutines = customRoutines.length ? customRoutines : ['Custom Session'];
          const generated = generateTwoWeekPlan(
            current.calendar.trainingPlan,
            current.goals.workoutDaysPerWeek,
            nextCustomRoutines
          );

          const nextRoutineColors = { ...(current.calendar.routineColors ?? {}) };
          const matchedKey = Object.keys(nextRoutineColors).find((k) => k.toLowerCase() === name.toLowerCase());
          if (matchedKey) {
            delete nextRoutineColors[matchedKey];
          }

          return {
            ...current,
            calendar: {
              ...current.calendar,
              customRoutines: nextCustomRoutines,
              entries: generated.entries,
              planOverrides: generated.planOverrides,
              routineColors: nextRoutineColors,
            },
          };
        });
      },
      updatePlannedWorkout: (isoDate, workoutName) => {
        const title = workoutName.trim();
        if (!title) {
          return;
        }

        setSettings((current) => {
          if (!current.calendar.entries[isoDate]) {
            return current;
          }

          return {
            ...current,
            calendar: {
              ...current.calendar,
              planOverrides: {
                ...current.calendar.planOverrides,
                [isoDate]: title,
              },
            },
          };
        });
      },
    }),
    [colors, loaded, settings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
