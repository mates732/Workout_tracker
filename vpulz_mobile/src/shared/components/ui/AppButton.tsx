import type { ReactNode } from 'react';
import {
  Pressable,
  type PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { colors, radius, typography } from '../../theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type AppButtonProps = PressableProps & {
  children: ReactNode;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
};

export function AppButton({ children, variant = 'primary', style, ...props }: AppButtonProps) {
  const textStyle = [
    styles.label,
    variant === 'primary' && styles.primaryLabel,
    variant === 'secondary' && styles.secondaryLabel,
    variant === 'ghost' && styles.ghostLabel,
    variant === 'danger' && styles.dangerLabel,
  ];

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
        pressed && styles.pressed,
        style,
      ]}
    >
      {typeof children === 'string' || typeof children === 'number' ? <Text style={textStyle}>{children}</Text> : children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderWidth: 1,
  },
  primary: {
    borderColor: 'transparent',
    backgroundColor: colors.primary,
  },
  secondary: {
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  ghost: {
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  danger: {
    borderColor: 'rgba(255,69,58,0.7)',
    backgroundColor: 'rgba(255,69,58,0.14)',
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontSize: typography.body,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  primaryLabel: {
    color: colors.primaryText,
  },
  secondaryLabel: {
    color: colors.primary,
  },
  ghostLabel: {
    color: colors.mutedText,
  },
  dangerLabel: {
    color: colors.danger,
  },
});
