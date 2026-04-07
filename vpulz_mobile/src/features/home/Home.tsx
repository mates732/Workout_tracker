import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, Vibration } from 'react-native';
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
  const {
    selectedDate,
    setSelectedDate,
    plannedWorkouts,
    workoutHistory,
    startPlannedWorkout,
    startOrResumeWorkout,
  } = useWorkoutFlow();

  const todayKey = useMemo(() => toDateKey(new Date().toISOString()), []);

  const selectedDayPlanned = useMemo(() => {
    return plannedWorkouts.filter((item) => item.date === selectedDate);
  }, [plannedWorkouts, selectedDate]);

  const selectedDayCompletedCount = useMemo(() => {
    return workoutHistory.filter((item) => toDateKey(item.completedAt) === selectedDate).length;
  }, [selectedDate, workoutHistory]);

  const nextWorkout = useMemo(() => {
    if (!plannedWorkouts.length) {
      return null;
    }

    return (
      plannedWorkouts.find((item) => item.date === todayKey) ??
      plannedWorkouts.find((item) => item.date > todayKey) ??
      plannedWorkouts[0]
    );
  }, [plannedWorkouts, todayKey]);

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

  const startWorkout = () => {
    Vibration.vibrate(8);
    startOrResumeWorkout();
    navigation.navigate('ActiveWorkout');
  };

  const startNextWorkout = () => {
    Vibration.vibrate(8);
    if (!nextWorkout) {
      startWorkout();
      return;
    }

    startPlannedWorkout(nextWorkout);
    navigation.navigate('ActiveWorkout');
  };

  const selectedDayIndicator = useMemo(() => {
    if (selectedDayPlanned.length) {
      return `${selectedDayPlanned.length} planned workout${selectedDayPlanned.length > 1 ? 's' : ''} for selected day`;
    }

    if (selectedDayCompletedCount) {
      return `${selectedDayCompletedCount} completed workout${selectedDayCompletedCount > 1 ? 's' : ''} on selected day`;
    }

    return 'No workout planned for selected day';
  }, [selectedDayCompletedCount, selectedDayPlanned.length]);

  const selectedDayPreview = useMemo(() => {
    const planned = selectedDayPlanned[0];
    if (!planned) {
      return null;
    }

    return `${planned.preview.title} • ${planned.preview.exercises.length} exercises • ~${planned.preview.estimatedDurationMin} min`;
  }, [selectedDayPlanned]);

  const startSelectedDayWorkout = () => {
    const planned = selectedDayPlanned[0];
    Vibration.vibrate(8);

    if (!planned) {
      startWorkout();
      return;
    }

    startPlannedWorkout(planned);
    navigation.navigate('ActiveWorkout');
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
          <Text style={styles.greeting}>Welcome back, Athlete</Text>
          <Text style={styles.subGreeting}>Your training dashboard is ready.</Text>
        </View>

        <AppCard style={styles.primaryCtaCard}>
          <Text style={styles.startButtonEyebrow}>Primary Action</Text>
          <Text style={styles.startButtonText}>Start Workout</Text>
          <Text style={styles.startButtonMeta}>Resumes your active session if one exists.</Text>
          <AppButton style={styles.primaryStartButton} onPress={startWorkout}>
            Start Workout
          </AppButton>
        </AppCard>

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
            {selectedDayIndicator}
          </Text>

          {selectedDayPreview ? (
            <View style={styles.selectedPlanWrap}>
              <Text style={styles.selectedPlanLabel}>Selected Day Plan</Text>
              <Text style={styles.selectedPlanValue}>{selectedDayPreview}</Text>
              <AppButton variant="secondary" style={styles.selectedPlanButton} onPress={startSelectedDayWorkout}>
                Start Selected
              </AppButton>
            </View>
          ) : null}
        </AppCard>

        <AppCard style={styles.nextWorkoutCard}>
          <Text style={styles.cardTitle}>Next Workout</Text>
          {nextWorkout ? (
            <>
              <Text style={styles.nextWorkoutName}>{nextWorkout.preview.title}</Text>
              <Text style={styles.nextWorkoutMeta}>{`${nextWorkout.preview.exercises.length} exercises`}</Text>
              <Text style={styles.nextWorkoutMeta}>{`~${nextWorkout.preview.estimatedDurationMin} min`}</Text>
              <View style={{ marginTop: spacing.sm }}>
                <AppButton onPress={startNextWorkout}>Start</AppButton>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.nextWorkoutName}>No routine scheduled yet</Text>
              <Text style={styles.nextWorkoutMeta}>Start from blank and the coach will shape your plan.</Text>
              <View style={{ marginTop: spacing.sm }}>
                <AppButton onPress={startWorkout}>Start Workout</AppButton>
              </View>
            </>
          )}
        </AppCard>
      </ScrollView>
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
    gap: spacing.xs,
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
  primaryCtaCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...shadows.soft,
  },
  startButtonEyebrow: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  startButtonText: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  startButtonMeta: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  primaryStartButton: {
    marginTop: spacing.xs,
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
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
  },
  calendarMeta: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  selectedPlanWrap: {
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated,
    padding: spacing.md,
    gap: spacing.sm,
  },
  selectedPlanLabel: {
    color: colors.mutedText,
    fontSize: typography.tiny,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  selectedPlanValue: {
    color: colors.text,
    fontSize: typography.caption,
    lineHeight: 20,
  },
  selectedPlanButton: {
    minHeight: 48,
  },
  nextWorkoutCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
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
});
