import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SETTINGS, type SettingsState } from '../state/settings.types';

const SETTINGS_STORAGE_KEY = 'vpulz.settings.v1';

export async function loadSettings(): Promise<SettingsState> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw) as Partial<SettingsState>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      profile: { ...DEFAULT_SETTINGS.profile, ...(parsed.profile ?? {}) },
      goals: { ...DEFAULT_SETTINGS.goals, ...(parsed.goals ?? {}) },
      workout: { ...DEFAULT_SETTINGS.workout, ...(parsed.workout ?? {}) },
      calendar: { ...DEFAULT_SETTINGS.calendar, ...(parsed.calendar ?? {}) },
      notifications: { ...DEFAULT_SETTINGS.notifications, ...(parsed.notifications ?? {}) },
      integrations: { ...DEFAULT_SETTINGS.integrations, ...(parsed.integrations ?? {}) },
      app: { ...DEFAULT_SETTINGS.app, ...(parsed.app ?? {}) },
      privacy: { ...DEFAULT_SETTINGS.privacy, ...(parsed.privacy ?? {}) },
      premium: { ...DEFAULT_SETTINGS.premium, ...(parsed.premium ?? {}) },
      smart: { ...DEFAULT_SETTINGS.smart, ...(parsed.smart ?? {}) },
      onboarding: { ...DEFAULT_SETTINGS.onboarding, ...(parsed.onboarding ?? {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: SettingsState): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}
