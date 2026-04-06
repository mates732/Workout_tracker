import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { CalendarComponent } from '../calendar/components/CalendarComponent';
import { AppButton, AppCard } from '../../shared/components/ui';
import { useWorkoutFlow } from '../../shared/state/WorkoutFlowContext';
import { colors, radius, shadows, spacing, typography } from '../../shared/theme/tokens';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList>;

function toDateKey(value: string): string {
  const dateOnlyMatch = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    return `${dateOnlyMatch[1]}-${dateOnlyMatch[2]}-${dateOnlyMatch[3]}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

export function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const insets = useSafeAreaInsets();
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const {
    selectedDate,
    setSelectedDate,
    plannedWorkouts,
    workoutHistory,
    userProfile,
    startEmptyWorkout,
    startPlannedWorkout,
    startOrResumeWorkout,
  } = useWorkoutFlow();

  const nextWorkout = useMemo(() => {
    if (!plannedWorkouts.length) {
      return null;
    }

    return plannedWorkouts.find((item) => item.date >= selectedDate) ?? plannedWorkouts[0];
  }, [plannedWorkouts, selectedDate]);

  const workoutDates = useMemo(() => {
    const keys = new Set<string>();

    plannedWorkouts.forEach((workout) => {
      keys.add(workout.date);
    });

    workoutHistory.forEach((entry) => {
      keys.add(toDateKey(entry.completedAt));
    });

    return Array.from(keys);
  }, [plannedWorkouts, workoutHistory]);

  const selectedDayCount = useMemo(() => {
    const planned = plannedWorkouts.filter((item) => item.date === selectedDate).length;
    const completed = workoutHistory.filter((item) => toDateKey(item.completedAt) === selectedDate).length;
    return planned + completed;
  }, [plannedWorkouts, selectedDate, workoutHistory]);

  const startBlankWorkout = () => {
    startEmptyWorkout();
    navigation.navigate('ActiveWorkout');
  };

  const openNextWorkout = () => {
    if (!nextWorkout) {
      startBlankWorkout();
      return;
    }

    startPlannedWorkout(nextWorkout);
    navigation.navigate('ActiveWorkout');
  };

  const openExerciseLibrary = () => {
    startOrResumeWorkout();
    setQuickActionsOpen(false);
    navigation.navigate('ExerciseLibrary');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + spacing.md,
            paddingBottom: insets.bottom + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topCopy}>
          <Text style={styles.greeting}>{`Welcome back, ${userProfile.username || 'Athlete'}`}</Text>
          <Text style={styles.subGreeting}>Build your next session in under a minute.</Text>
        </View>

        <Pressable
          style={styles.startButton}
          onPress={startBlankWorkout}
          accessibilityRole="button"
          accessibilityLabel="Start new workout"
        >
          <Text style={styles.startButtonEyebrow}>Quick Start</Text>
          <Text style={styles.startButtonText}>Start New Workout</Text>
        </Pressable>

        <AppCard style={styles.calendarCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Calendar</Text>
            <AppButton
              variant="secondary"
              style={styles.headerButton}
              onPress={() => navigation.navigate('Calendar')}
            >
              Full View
            </AppButton>
          </View>

          <CalendarComponent
            selectedDate={selectedDate}
            workoutDates={workoutDates}
            onSelectDate={setSelectedDate}
            weeksToRender={9}
          />

          <Text style={styles.calendarMeta}>
            {selectedDayCount > 0
              ? `${selectedDayCount} workout${selectedDayCount > 1 ? 's' : ''} on selected day`
              : 'No workout planned for selected day'}
          </Text>
        </AppCard>

        <AppCard style={styles.nextWorkoutCard}>
          <Text style={styles.cardTitle}>Next Workout</Text>
          {nextWorkout ? (
            <>
              <Text style={styles.nextWorkoutName}>{nextWorkout.preview.title}</Text>
              <Text style={styles.nextWorkoutMeta}>{`${nextWorkout.preview.exercises.length} exercises`}</Text>
              <Text style={styles.nextWorkoutMeta}>{`~${nextWorkout.preview.estimatedDurationMin} min`}</Text>
              <View style={{ marginTop: spacing.sm }}>
                <AppButton onPress={openNextWorkout}>Open Workout</AppButton>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.nextWorkoutName}>No routine scheduled yet</Text>
              <Text style={styles.nextWorkoutMeta}>Start from blank and the coach will shape your plan.</Text>
              <View style={{ marginTop: spacing.sm }}>
                <AppButton onPress={startBlankWorkout}>Start Blank Workout</AppButton>
              </View>
            </>
          )}
        </AppCard>
      </ScrollView>

      <Pressable
        style={[styles.fab, { bottom: Math.max(96, insets.bottom + 84) }]}
        onPress={() => setQuickActionsOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Open quick actions"
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <Modal
        visible={quickActionsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setQuickActionsOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setQuickActionsOpen(false)}>
          <View style={styles.quickSheet}>
            <Text style={styles.quickTitle}>Quick Actions</Text>
            <AppButton
              style={styles.quickButton}
              onPress={() => {
                setQuickActionsOpen(false);
                startBlankWorkout();
              }}
            >
              Create New Workout
            </AppButton>
            <AppButton variant="secondary" style={styles.quickButton} onPress={openExerciseLibrary}>
              Open Exercise Library
            </AppButton>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  topCopy: {
    gap: 4,
  },
  greeting: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subGreeting: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  startButton: {
    width: '100%',
    minHeight: 92,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    gap: 2,
    ...shadows.lifted,
  },
  startButtonEyebrow: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  startButtonText: {
    color: colors.primaryText,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  calendarCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  headerButton: {
    minHeight: 34,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
  },
  calendarMeta: {
    color: colors.mutedText,
    fontSize: typography.caption,
    marginTop: 2,
  },
  nextWorkoutCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceStrong,
  },
  nextWorkoutName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  nextWorkoutMeta: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lifted,
  },
  fabText: {
    color: colors.primaryText,
    fontSize: 30,
    fontWeight: '600',
    marginTop: -1,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#000000A6',
  },
  quickSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  quickTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  quickButton: {
    minHeight: 50,
  },
});
