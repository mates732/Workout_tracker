export const palette = {
  bg: "#36454F",
  bgDark: "#2B3940",
  bgDeep: "#1E2B32",
  card: "rgba(255,255,255,0.07)",
  cardBorder: "rgba(255,255,255,0.12)",
  text: "#F9F6EE",
  textMuted: "rgba(249,246,238,0.72)",
  textDim: "rgba(249,246,238,0.42)",
  accent: "#F9F6EE",
  accentBg: "rgba(249,246,238,0.12)",
  success: "#AFE1AF",
  successBg: "rgba(175,225,175,0.20)",
  danger: "#E05A3A",
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

export const typography = {
  tiny: 11,
  caption: 12,
  body: 14,
  subtitle: 16,
  title: 24,
  hero: 32,
} as const;
