export const colors = {
  background: '#000000',
  backgroundElevated: '#0B0B0C',
  surface: '#111111',
  surfaceStrong: '#141414',
  text: '#FFFFFF',
  mutedText: '#8E8E93',
  secondaryText: '#C7C7CC',
  primary: '#0A84FF',
  primaryText: '#FFFFFF',
  border: '#1C1C1E',
  glow: '#4AA3FF',
  danger: '#FF453A',
  success: '#34C759',
  accent: '#34C759',
  planned: '#34C759',
  sick: '#9A9A9A',
  splitLegs: '#FF3B30',
  splitArms: '#34C759',
  splitChest: '#0A84FF',
  splitBack: '#64D2FF',
} as const;

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
} as const;

export const typography = {
  title: 30,
  subtitle: 21,
  body: 16,
  caption: 13,
  tiny: 11,
  stat: 34,
} as const;

export const radius = {
  sm: 20,
  md: 22,
  lg: 24,
  xl: 28,
  pill: 999,
} as const;

export const shadows = {
  soft: {
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  lifted: {
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
} as const;
