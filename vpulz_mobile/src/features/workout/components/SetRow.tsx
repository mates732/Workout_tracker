import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { TextInput as TextInputType } from 'react-native';
import type { SetType } from '../../../shared/api/workoutApi';
import { colors, spacing, typography } from '../../../shared/theme/tokens';

interface Props {
  index: number;
  type: SetType;
  completed: boolean;
  active?: boolean;
  weight?: string;
  reps?: string;
  onChangeWeight: (v: string) => void;
  onChangeReps: (v: string) => void;
  onPressType: () => void;
  onToggleComplete: () => void | Promise<void>;
}

function labelForType(type: SetType, index: number): string {
  if (type === 'warmup') return 'W';
  if (type === 'pr') return 'P';
  if (type === 'drop') return 'D';
  if (type === 'failure') return 'F';
  return String(index);
}

const SetRow: React.FC<Props> = ({
  index,
  type,
  completed,
  active,
  weight = '',
  reps = '',
  onChangeWeight,
  onChangeReps,
  onPressType,
  onToggleComplete,
}) => {
  const rowScale = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(completed ? 1 : 0)).current;
  const checkOpacity = useRef(new Animated.Value(completed ? 1 : 0)).current;
  const weightRef = useRef<TextInputType>(null);

  const label = useMemo(() => labelForType(type, index), [type, index]);

  useEffect(() => {
    if (completed) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(rowScale, {
            toValue: 0.985,
            duration: 80,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(rowScale, {
            toValue: 1,
            duration: 180,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(checkScale, { toValue: 1.15, duration: 120, useNativeDriver: true }),
          Animated.timing(checkScale, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]),
        Animated.timing(checkOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(checkOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(checkScale, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start();
  }, [completed, rowScale, checkScale, checkOpacity]);

  useEffect(() => {
    if (!active || completed) {
      return;
    }
    const handle = setTimeout(() => {
      weightRef.current?.focus();
    }, 40);

    return () => clearTimeout(handle);
  }, [active, completed]);

  return (
    <Animated.View
      style={[
        styles.row,
        active ? styles.active : null,
        completed ? styles.completedRow : null,
        { transform: [{ scale: rowScale }] },
      ]}
    >
      <Pressable style={styles.typeButton} onPress={onPressType} accessibilityRole="button">
        <Text style={[styles.typeText, type !== 'normal' ? styles.typeTextAccent : null]}>{label}</Text>
      </Pressable>

      <TextInput
        ref={weightRef}
        value={weight}
        onChangeText={onChangeWeight}
        keyboardType="numeric"
        placeholder="kg"
        placeholderTextColor={colors.mutedText}
        style={styles.input}
      />

      <TextInput
        value={reps}
        onChangeText={onChangeReps}
        keyboardType="numeric"
        placeholder="reps"
        placeholderTextColor={colors.mutedText}
        style={styles.input}
      />

      <Pressable
        onPress={() => void onToggleComplete()}
        accessibilityRole="button"
        accessibilityState={{ checked: completed }}
        style={[styles.checkButton, completed ? styles.checkButtonCompleted : null]}
      >
        <Animated.View style={{ opacity: checkOpacity, transform: [{ scale: checkScale }] }}>
          <Text style={[styles.checkText, completed ? styles.checkTextCompleted : null]}>{completed ? '✓' : '○'}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: 10,
  },
  active: {
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  completedRow: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
  },
  typeButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundElevated,
  },
  typeText: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  typeTextAccent: {
    color: '#86EFAC',
  },
  input: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    color: colors.text,
    backgroundColor: colors.backgroundElevated,
    paddingHorizontal: spacing.sm,
    fontSize: typography.body,
    fontWeight: '600',
  },
  checkButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundElevated,
  },
  checkButtonCompleted: {
    backgroundColor: 'rgba(34,197,94,0.2)',
    borderColor: 'rgba(34,197,94,0.5)',
  },
  checkText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  checkTextCompleted: {
    color: '#86EFAC',
  },
});

export default SetRow;
