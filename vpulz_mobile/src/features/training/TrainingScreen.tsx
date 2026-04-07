import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Vibration } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { AppButton, AppCard } from '../../shared/components/ui';
import { useWorkoutFlow } from '../../shared/state/WorkoutFlowContext';
import { colors, radius, shadows, spacing, typography } from '../../shared/theme/tokens';

type TrainingNavigationProp = NativeStackNavigationProp<RootStackParamList>;

function formatDate(value: string): string {
  const dateOnlyMatch = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = Number.parseInt(dateOnlyMatch[1], 10);
    const month = Number.parseInt(dateOnlyMatch[2], 10);
    const day = Number.parseInt(dateOnlyMatch[3], 10);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function TrainingScreen() {
  const navigation = useNavigation<TrainingNavigationProp>();
  const insets = useSafeAreaInsets();
  const {
    currentWorkout,
    plannedWorkouts,
    workoutHistory,
    startEmptyWorkout,
    startOrResumeWorkout,
    startPlannedWorkout,
  } = useWorkoutFlow();

  const routines = useMemo(() => plannedWorkouts.slice(0, 5), [plannedWorkouts]);
  const recent = useMemo(() => workoutHistory.slice(0, 4), [workoutHistory]);

  const startBlank = () => {
    Vibration.vibrate(8);
    startEmptyWorkout();
    navigation.navigate('ActiveWorkout');
  };

  const resumeWorkout = () => {
    Vibration.vibrate(8);
    startOrResumeWorkout();
    navigation.navigate('ActiveWorkout');
  };

  const openRoutine = (index: number) => {
    const routine = routines[index];
    if (!routine) {
      return;
    }

    Vibration.vibrate(8);
    startPlannedWorkout(routine);
    navigation.navigate('ActiveWorkout');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]} edges={[]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Training</Text>
          <Text style={styles.subtitle}>Routines and history in one clean flow.</Text>
        </View>

        <AppCard style={styles.primaryCard}>
          <Text style={styles.sectionTitle}>Start New Training</Text>
          <AppButton style={styles.cardButton} onPress={startBlank}>
            Start Blank Workout
          </AppButton>
          {currentWorkout ? (
            <AppButton variant="secondary" style={styles.cardButton} onPress={resumeWorkout}>
              Resume Workout
            </AppButton>
          ) : null}
        </AppCard>

        <AppCard>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Routines</Text>
            <AppButton variant="secondary" style={styles.inlineButton} onPress={() => navigation.navigate('Calendar')}>
              Calendar
            </AppButton>
          </View>
          {routines.length ? (
            routines.map((routine, index) => (
              <Pressable
                key={`${routine.date}-${routine.preview.id}-${index}`}
                style={styles.routineRow}
                onPress={() => openRoutine(index)}
              >
                <View style={styles.routineCopy}>
                  <Text style={styles.routineTitle}>{routine.preview.title}</Text>
                  <Text style={styles.routineMeta}>{`${routine.preview.exercises.length} exercises • ${routine.preview.estimatedDurationMin} min`}</Text>
                  <Text style={styles.routineMeta}>{`Scheduled: ${formatDate(routine.date)}`}</Text>
                </View>
                <Text style={styles.routineAction}>Start</Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.emptyText}>No routines generated yet. Start one blank session and AI coach will create your next blocks.</Text>
          )}
        </AppCard>

        <AppCard>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>History</Text>
            <AppButton variant="secondary" style={styles.inlineButton} onPress={() => navigation.navigate('Calendar')}>
              Full View
            </AppButton>
          </View>
          {recent.length ? (
            recent.map((entry) => (
              <View key={`${entry.id}-${entry.completedAt}`} style={styles.historyRow}>
                <View style={styles.routineCopy}>
                  <Text style={styles.routineTitle}>{entry.summaryLine || 'Completed Workout'}</Text>
                  <Text style={styles.routineMeta}>{`${entry.completedSets}/${entry.totalSets} sets • score ${entry.performance.toFixed(2)}`}</Text>
                </View>
                <Text style={styles.historyDate}>{formatDate(entry.completedAt)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No completed sessions yet.</Text>
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
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  primaryCard: {
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  cardButton: {
    minHeight: 52,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  inlineButton: {
    minHeight: 40,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
  },
  routineRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.backgroundElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  historyRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.backgroundElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  routineCopy: {
    flex: 1,
    gap: 2,
  },
  routineTitle: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  routineMeta: {
    color: colors.mutedText,
    fontSize: typography.tiny,
  },
  routineAction: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  historyDate: {
    color: colors.mutedText,
    fontSize: typography.tiny,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.mutedText,
    fontSize: typography.caption,
    lineHeight: 18,
  },
});
