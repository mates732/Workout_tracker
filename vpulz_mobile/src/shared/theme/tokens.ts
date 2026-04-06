export const colors = {
  background: '#000000',
  backgroundElevated: '#0F0F10',
  surface: '#111111',
  surfaceStrong: '#1A1A1A',
  text: '#FFFFFF',
  mutedText: '#9B9BA1',
  secondaryText: '#D1D1D8',
  primary: '#0A84FF',
  primaryText: '#FFFFFF',
  border: '#2A2A2F',
  glow: '#4AA3FF',
  danger: '#FF453A',
  success: '#34C759',
  accent: '#34C759',
  planned: '#9A9A9A',
  sick: '#9A9A9A',
  splitLegs: '#FF3B30',
  splitArms: '#34C759',
  splitChest: '#0A84FF',
  splitBack: '#64D2FF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 36,
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
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

export const shadows = {
  soft: {
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  lifted: {
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
} as const;
