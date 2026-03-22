import { StyleSheet } from 'react-native';
import { appRadius, appSpacing, type AppColors } from './appTheme';

export const reusableStyles = {
  spacing: appSpacing,
};

export const getReusableStyles = (colors: AppColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: appSpacing.xl,
      paddingTop: appSpacing.md,
      paddingBottom: appSpacing.xxl,
      gap: appSpacing.md,
    },
    card: {
      borderWidth: 1,
      borderRadius: appRadius.lg,
      padding: appSpacing.md,
      gap: appSpacing.sm,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    cardAlt: {
      borderWidth: 1,
      borderRadius: appRadius.lg,
      padding: appSpacing.md,
      gap: appSpacing.sm,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    title: {
      fontSize: 30,
      fontWeight: '700',
      letterSpacing: -0.5,
      color: colors.text,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textMuted,
    },
    textPrimary: {
      color: colors.text,
    },
    textSecondary: {
      color: colors.textMuted,
    },
    input: {
      minHeight: 46,
      borderRadius: appRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      color: colors.text,
      paddingHorizontal: appSpacing.md,
      fontSize: 14,
    },
  });
