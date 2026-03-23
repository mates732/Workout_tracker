import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkoutFlow } from '../../shared/state/WorkoutFlowContext';

type MinimizedWorkoutBarProps = {
  onPress: () => void;
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const MinimizedWorkoutBar = memo(function MinimizedWorkoutBar({ onPress }: MinimizedWorkoutBarProps) {
  const { session, elapsedSeconds, isWorkoutMinimized, restoreWorkout } = useWorkoutFlow();
  const insets = useSafeAreaInsets();

  const workoutName = useMemo(() => {
    if (!session.exercises.length) {
      return 'Workout Session';
    }

    const first = session.exercises[0];
    if (session.exercises.length === 1) {
      return first;
    }

    return `${first} +${session.exercises.length - 1}`;
  }, [session.exercises]);

  if (!session.isActive || !isWorkoutMinimized) {
    return null;
  }

  const bottomOffset = Math.max(16, insets.bottom + 8);

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
        <Text style={styles.chevron}>↑</Text>
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
  },
  bar: {
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    backgroundColor: '#000',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leftDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  timer: {
    color: '#d4d4d4',
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 16,
  },
});
