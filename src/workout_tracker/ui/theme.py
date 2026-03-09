# ui/theme.py
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ColorScale:
    c50: str
    c100: str
    c200: str
    c300: str
    c400: str
    c500: str
    c600: str
    c700: str
    c800: str
    c900: str


@dataclass(frozen=True)
class Theme:
    name: str
    background: ColorScale
    primary: ColorScale
    accent: ColorScale
    success: ColorScale
    warning: ColorScale
    card_surface: str
    gradient_primary: str
    gradient_accent: str


LIGHT_THEME = Theme(
    name="light",
    background=ColorScale("#F8FAFC", "#F1F5F9", "#E2E8F0", "#CBD5E1", "#94A3B8", "#64748B", "#475569", "#334155", "#1E293B", "#0F172A"),
    primary=ColorScale("#EEF2FF", "#E0E7FF", "#C7D2FE", "#A5B4FC", "#818CF8", "#6366F1", "#4F46E5", "#4338CA", "#3730A3", "#312E81"),
    accent=ColorScale("#F0FDFA", "#CCFBF1", "#99F6E4", "#5EEAD4", "#2DD4BF", "#14B8A6", "#0D9488", "#0F766E", "#115E59", "#134E4A"),
    success=ColorScale("#F0FDF4", "#DCFCE7", "#BBF7D0", "#86EFAC", "#4ADE80", "#22C55E", "#16A34A", "#15803D", "#166534", "#14532D"),
    warning=ColorScale("#FFFBEB", "#FEF3C7", "#FDE68A", "#FCD34D", "#FBBF24", "#F59E0B", "#D97706", "#B45309", "#92400E", "#78350F"),
    card_surface="#FFFFFF",
    gradient_primary="linear-gradient(135deg, #6366F1 0%, #4338CA 100%)",
    gradient_accent="linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)",
)

DARK_THEME = Theme(
    name="dark",
    background=ColorScale("#0F172A", "#0B1220", "#0A1325", "#081024", "#070C1A", "#060A16", "#050914", "#04070F", "#03060B", "#020617"),
    primary=ColorScale("#F5F3FF", "#EDE9FE", "#DDD6FE", "#C4B5FD", "#A78BFA", "#8B5CF6", "#7C3AED", "#6D28D9", "#5B21B6", "#4C1D95"),
    accent=ColorScale("#ECFEFF", "#CFFAFE", "#A5F3FC", "#67E8F9", "#22D3EE", "#06B6D4", "#0891B2", "#0E7490", "#155E75", "#164E63"),
    success=ColorScale("#052E16", "#14532D", "#166534", "#15803D", "#16A34A", "#22C55E", "#4ADE80", "#86EFAC", "#BBF7D0", "#DCFCE7"),
    warning=ColorScale("#451A03", "#78350F", "#92400E", "#B45309", "#D97706", "#F59E0B", "#FBBF24", "#FCD34D", "#FDE68A", "#FEF3C7"),
    card_surface="#0F172A",
    gradient_primary="linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)",
    gradient_accent="linear-gradient(135deg, #06B6D4 0%, #164E63 100%)",
)


def get_theme(name: str) -> Theme:
    """Return theme by name."""
    normalized = name.strip().lower()
    if normalized == "dark":
        return DARK_THEME
    if normalized == "light":
        return LIGHT_THEME
    raise ValueError("Theme must be 'light' or 'dark'")
