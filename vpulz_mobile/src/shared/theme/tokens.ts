export const colors = {
  background: '#0A0A0F',
  backgroundElevated: '#111118',
  surface: '#16161F',
  surfaceStrong: '#1E1E28',
  text: '#FFFFFF',
  mutedText: '#6B6B80',
  secondaryText: '#9CA3AF',
  primary: '#8B5CF6',
  primaryText: '#FFFFFF',
  border: '#23232F',
  glow: '#A78BFA',
  danger: '#EF4444',
  success: '#22C55E',
  accent: '#8B5CF6',
  planned: '#22C55E',
  sick: '#6B6B80',
  splitLegs: '#EF4444',
  splitArms: '#22C55E',
  splitChest: '#3B82F6',
  splitBack: '#06B6D4',
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
