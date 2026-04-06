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
  previousLabel?: string;
  completed: boolean;
  active?: boolean;
  editable?: boolean;
  toggleDisabled?: boolean;
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
  previousLabel = '-',
  completed,
  active,
  editable = true,
  toggleDisabled = false,
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
    if (!active || completed || !editable) {
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

      <View style={styles.previousCell}>
        <Text numberOfLines={1} style={styles.previousText}>{previousLabel}</Text>
      </View>

      <TextInput
        ref={weightRef}
        value={weight}
        onChangeText={onChangeWeight}
        editable={editable}
        keyboardType="numeric"
        placeholder="kg"
        placeholderTextColor={colors.mutedText}
        style={[styles.input, !editable ? styles.inputReadonly : null]}
      />

      <TextInput
        value={reps}
        onChangeText={onChangeReps}
        editable={editable}
        keyboardType="numeric"
        placeholder="reps"
        placeholderTextColor={colors.mutedText}
        style={[styles.input, !editable ? styles.inputReadonly : null]}
      />

      <Pressable
        onPress={() => {
          if (!toggleDisabled) {
            void onToggleComplete();
          }
        }}
        accessibilityRole="button"
        disabled={toggleDisabled}
        accessibilityState={{ checked: completed }}
        style={[styles.checkButton, completed ? styles.checkButtonCompleted : null, toggleDisabled ? styles.checkButtonDisabled : null]}
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
    width: 40,
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
  previousCell: {
    flex: 1,
    minWidth: 78,
    paddingHorizontal: spacing.xs,
  },
  previousText: {
    color: colors.mutedText,
    fontSize: typography.tiny,
    fontWeight: '600',
  },
  input: {
    width: 66,
    minHeight: 42,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    color: colors.text,
    backgroundColor: colors.backgroundElevated,
    paddingHorizontal: spacing.sm,
    fontSize: typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputReadonly: {
    color: colors.secondaryText,
    backgroundColor: colors.surface,
  },
  checkButton: {
    width: 36,
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
  checkButtonDisabled: {
    opacity: 0.45,
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
