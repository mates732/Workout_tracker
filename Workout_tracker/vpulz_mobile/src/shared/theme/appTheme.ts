import type { Theme } from '@react-navigation/native';
import type { ThemeMode } from '../../features/settings/state/settings.types';

export type AppColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  success: string;
  planned: string;
  sick: string;
};

const darkColors: AppColors = {
  background: '#000000',
  surface: '#111111',
  surfaceAlt: '#1A1A1A',
  border: '#1A1A1A',
  text: '#FFFFFF',
  textMuted: '#9A9A9A',
  success: '#22C55E',
  planned: '#9A9A9A',
  sick: '#9A9A9A',
};

const lightColors: AppColors = {
  background: '#000000',
  surface: '#111111',
  surfaceAlt: '#1A1A1A',
  border: '#1A1A1A',
  text: '#FFFFFF',
  textMuted: '#9A9A9A',
  success: '#22C55E',
  planned: '#9A9A9A',
  sick: '#9A9A9A',
};

export const appSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const appRadius = {
  sm: 8,
  md: 12,
  lg: 14,
} as const;

export function getAppColors(mode: ThemeMode): AppColors {
  return mode === 'light' ? lightColors : darkColors;
}

export function getNavigationTheme(mode: ThemeMode): Theme {
  const palette = getAppColors(mode);
  return {
    dark: mode !== 'light',
    colors: {
      primary: palette.text,
      background: palette.background,
      card: palette.surface,
      text: palette.text,
      border: palette.border,
      notification: palette.success,
    },
  };
}
