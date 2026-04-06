import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkoutFlow } from '../../shared/state/WorkoutFlowContext';
import { colors, typography } from '../../shared/theme/tokens';

type MinimizedWorkoutBarProps = {
  onPress: () => void;
};

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export const MinimizedWorkoutBar = memo(function MinimizedWorkoutBar({ onPress }: MinimizedWorkoutBarProps) {
  const { currentWorkout, isWorkoutMinimized, restoreWorkout, timerState } = useWorkoutFlow();
  const insets = useSafeAreaInsets();
  const workoutName = currentWorkout?.plan.title ?? 'Workout Session';
  const elapsedSeconds = timerState.elapsedSeconds;

  if (!currentWorkout || !isWorkoutMinimized) {
    return null;
  }

  // Keep the minimized bar above bottom tabs so the tab menu stays clickable.
  const tabBarHeight = 68;
  const tabBarMarginBottom = 14;
  const bottomOffset = Math.max(90, insets.bottom + tabBarHeight + tabBarMarginBottom + 8);

  return (
    <View style={[styles.wrap, { bottom: bottomOffset }]} pointerEvents="box-none">
      <Pressable
        style={styles.bar}
        onPress={() => {
          restoreWorkout();
          onPress();
        }}
      >
        <View style={styles.leftDot} />
        <View style={styles.center}>
          <Text style={styles.name} numberOfLines={1}>{workoutName}</Text>
          <Text style={styles.timer}>{formatDuration(elapsedSeconds)}</Text>
        </View>
        <Text style={styles.chevron}>^</Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 92,
    zIndex: 100,
    elevation: 100,
  },
  bar: {
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leftDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  center: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  timer: {
    color: colors.mutedText,
    fontSize: typography.caption,
    marginTop: 2,
  },
  chevron: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 16,
  },
});
