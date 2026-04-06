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
    minHeight: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 0,
  },
  primary: {
    borderColor: 'transparent',
    backgroundColor: colors.primary,
    borderWidth: 0,
  },
  secondary: {
    borderColor: 'rgba(10,132,255,0.55)',
    backgroundColor: 'transparent',
    borderWidth: 1,
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
    fontWeight: '700',
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
