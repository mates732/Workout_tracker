export const palette = {
  bg: "#141419",
  bgDark: "#0F0F14",
  bgDeep: "#0B0B0F",
  card: "rgba(255,255,255,0.06)",
  cardBorder: "rgba(255,255,255,0.10)",
  text: "#F0EEFF",
  textMuted: "rgba(240,238,255,0.68)",
  textDim: "rgba(240,238,255,0.38)",
  accent: "#7C6AF5",
  accentLight: "#9D8FF8",
  accentBg: "rgba(124,106,245,0.22)",
  accentBorder: "rgba(124,106,245,0.45)",
  success: "#4ADE80",
  successBg: "rgba(74,222,128,0.14)",
  danger: "#F87171",
  dangerBg: "rgba(248,113,113,0.14)",
  dangerBorder: "rgba(248,113,113,0.45)",
} as const;

// Apple Calendar-style today indicator
export const todayColor = "#FF453A";

// Split-based colors: bright = future planned, dark = completed
export const splitColors = {
  push: {
    bright: "#FBBC04",
    dark: "#6B4F00",
    brightBg: "rgba(251,188,4,0.16)",
    darkBg: "rgba(107,79,0,0.26)",
    label: "#FBBC04",
  },
  pull: {
    bright: "#4A90F0",
    dark: "#18336E",
    brightBg: "rgba(74,144,240,0.16)",
    darkBg: "rgba(24,51,110,0.26)",
    label: "#4A90F0",
  },
  legs: {
    bright: "#F87171",
    dark: "#7A1A1A",
    brightBg: "rgba(248,113,113,0.16)",
    darkBg: "rgba(122,26,26,0.26)",
    label: "#F87171",
  },
} as const;

export const splitLabel: Record<string, string> = {
  push: "Push Day",
  pull: "Pull Day",
  legs: "Leg Day",
};

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
