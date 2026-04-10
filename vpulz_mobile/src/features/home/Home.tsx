import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Vibration } from 'react-native';
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

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}k`;
  return String(Math.round(kg));
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getSplitColor(splitKey: string): string {
  switch (splitKey.toLowerCase()) {
    case 'push': return colors.splitChest;
    case 'pull': return colors.splitBack;
    case 'legs': return colors.splitLegs;
    case 'arms': return colors.splitArms;
    default: return colors.primary;
  }
}

export function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const insets = useSafeAreaInsets();
  const {
    selectedDate,
    setSelectedDate,
    plannedWorkouts,
    workoutHistory,
    lastWorkoutSummary,
    currentWorkout,
    elapsedSeconds,
    userProfile,
    startPlannedWorkout,
    startOrResumeWorkout,
  } = useWorkoutFlow();

  const todayKey = useMemo(() => toDateKey(new Date().toISOString()), []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const username = userProfile?.username || 'Athlete';

  // Weekly stats — last 7 days
  const weekStats = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 6);
    cutoff.setHours(0, 0, 0, 0);
    const entries = workoutHistory.filter((w) => new Date(w.completedAt) >= cutoff);
    return {
      count: entries.length,
      volume: entries.reduce((s, w) => s + w.totalVolume, 0),
    };
  }, [workoutHistory]);

  const selectedDayPlanned = useMemo(
    () => plannedWorkouts.filter((item) => item.date === selectedDate),
    [plannedWorkouts, selectedDate]
  );

  const selectedDayCompleted = useMemo(
    () => workoutHistory.filter((item) => toDateKey(item.completedAt) === selectedDate),
    [selectedDate, workoutHistory]
  );

  const workoutDates = useMemo(() => {
    const keys = new Set<string>();
    plannedWorkouts.forEach((w) => keys.add(w.date));
    workoutHistory.forEach((e) => keys.add(toDateKey(e.completedAt)));
    return Array.from(keys);
  }, [plannedWorkouts, workoutHistory]);

  const nextWorkout = useMemo(() => {
    if (!plannedWorkouts.length) return null;
    return (
      plannedWorkouts.find((item) => item.date === todayKey) ??
      plannedWorkouts.find((item) => item.date > todayKey) ??
      null
    );
  }, [plannedWorkouts, todayKey]);

  const startWorkout = () => {
    Vibration.vibrate(8);
    startOrResumeWorkout();
    navigation.navigate('ActiveWorkout');
  };

  const startNextWorkout = () => {
    Vibration.vibrate(8);
    if (!nextWorkout) { startWorkout(); return; }
    startPlannedWorkout(nextWorkout);
    navigation.navigate('ActiveWorkout');
  };

  const startSelectedDayWorkout = () => {
    const planned = selectedDayPlanned[0];
    Vibration.vibrate(8);
    if (!planned) { startWorkout(); return; }
    startPlannedWorkout(planned);
    navigation.navigate('ActiveWorkout');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.username}>{username}</Text>
        </View>

        {/* ── Active workout banner ───────────────────────────── */}
        {currentWorkout && (
          <Pressable
            style={styles.activeBanner}
            onPress={() => navigation.navigate('ActiveWorkout')}
          >
            <View style={styles.activePulse} />
            <Text style={styles.activeBannerLabel}>Workout in progress</Text>
            <Text style={styles.activeBannerTime}>{formatElapsed(elapsedSeconds)}</Text>
            <Text style={styles.activeBannerCaret}>›</Text>
          </Pressable>
        )}

        {/* ── Weekly stats strip ─────────────────────────────── */}
        <View style={styles.statsStrip}>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{weekStats.count}</Text>
            <Text style={styles.statLabel}>THIS WEEK</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{formatVolume(weekStats.volume)}</Text>
            <Text style={styles.statLabel}>VOLUME 7D</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statValue}>
              {lastWorkoutSummary ? String(lastWorkoutSummary.durationMinutes) : '—'}
            </Text>
            <Text style={styles.statLabel}>LAST MIN</Text>
          </View>
        </View>

        {/* ── Primary CTA ────────────────────────────────────── */}
        {!currentWorkout && (
          <AppButton style={styles.ctaButton} onPress={startWorkout}>
            Start Workout
          </AppButton>
        )}

        {/* ── Calendar card ──────────────────────────────────── */}
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

          {/* Selected day detail */}
          {(selectedDayPlanned.length > 0 || selectedDayCompleted.length > 0) && (
            <View style={styles.selectedDayRow}>
              {selectedDayCompleted.length > 0 ? (
                <Text style={styles.selectedDayText}>
                  {selectedDayCompleted.length === 1
                    ? '1 workout completed'
                    : `${selectedDayCompleted.length} workouts completed`}
                </Text>
              ) : (
                <>
                  <Text style={styles.selectedDayText} numberOfLines={1}>
                    {selectedDayPlanned[0].preview.title}
                  </Text>
                  <AppButton
                    variant="secondary"
                    style={styles.selectedStartBtn}
                    onPress={startSelectedDayWorkout}
                  >
                    Start
                  </AppButton>
                </>
              )}
            </View>
          )}
        </AppCard>

        {/* ── Last Workout card ──────────────────────────────── */}
        {lastWorkoutSummary && (
          <AppCard style={styles.lastCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Last Workout</Text>
              <View
                style={[
                  styles.splitBadge,
                  { borderColor: getSplitColor(lastWorkoutSummary.splitKey) + '55' },
                ]}
              >
                <Text
                  style={[
                    styles.splitBadgeText,
                    { color: getSplitColor(lastWorkoutSummary.splitKey) },
                  ]}
                >
                  {lastWorkoutSummary.splitKey.toUpperCase()}
                </Text>
              </View>
            </View>

            {lastWorkoutSummary.summaryLine ? (
              <Text style={styles.summaryLine}>{lastWorkoutSummary.summaryLine}</Text>
            ) : null}

            <View style={styles.miniStats}>
              <View style={styles.miniStatCell}>
                <Text style={styles.miniStatValue}>{lastWorkoutSummary.durationMinutes}</Text>
                <Text style={styles.miniStatLabel}>min</Text>
              </View>
              <View style={styles.miniStatCell}>
                <Text style={styles.miniStatValue}>{formatVolume(lastWorkoutSummary.totalVolume)}</Text>
                <Text style={styles.miniStatLabel}>kg</Text>
              </View>
              <View style={styles.miniStatCell}>
                <Text style={styles.miniStatValue}>{lastWorkoutSummary.completedSets}</Text>
                <Text style={styles.miniStatLabel}>sets</Text>
              </View>
              {lastWorkoutSummary.prs > 0 && (
                <View style={styles.miniStatCell}>
                  <Text style={[styles.miniStatValue, { color: colors.success }]}>
                    {lastWorkoutSummary.prs}
                  </Text>
                  <Text style={styles.miniStatLabel}>PRs</Text>
                </View>
              )}
            </View>
          </AppCard>
        )}

        {/* ── Next planned workout ───────────────────────────── */}
        {nextWorkout && (
          <AppCard style={styles.nextCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Next Workout</Text>
              <Text style={styles.nextDateChip}>
                {nextWorkout.date === todayKey ? 'Today' : nextWorkout.date.slice(5)}
              </Text>
            </View>
            <Text style={styles.nextName}>{nextWorkout.preview.title}</Text>
            <Text style={styles.nextMeta}>
              {`${nextWorkout.preview.exercises.length} exercises · ~${nextWorkout.preview.estimatedDurationMin} min`}
            </Text>
            <AppButton style={styles.nextButton} onPress={startNextWorkout}>
              Start
            </AppButton>
          </AppCard>
        )}
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

  // Header
  header: {
    gap: 2,
    marginBottom: spacing.xs,
  },
  greeting: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  username: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },

  // Active banner
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary + '55',
  },
  activePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  activeBannerLabel: {
    flex: 1,
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  activeBannerTime: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  activeBannerCaret: {
    color: colors.mutedText,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },

  // Stats strip
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    ...shadows.soft,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statLabel: {
    color: colors.mutedText,
    fontSize: typography.tiny,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  statDivider: {
    width: 1,
    height: '70%',
    backgroundColor: colors.border,
    alignSelf: 'center',
  },

  // CTA button
  ctaButton: {
    minHeight: 54,
    borderRadius: radius.lg,
  },

  // Calendar card
  calendarCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  headerButton: {
    minHeight: 34,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
  },
  selectedDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  selectedDayText: {
    flex: 1,
    color: colors.secondaryText,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  selectedStartBtn: {
    minHeight: 34,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },

  // Last Workout card
  lastCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  splitBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  splitBadgeText: {
    fontSize: typography.tiny,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  summaryLine: {
    color: colors.mutedText,
    fontSize: typography.caption,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  miniStats: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  miniStatCell: {
    alignItems: 'center',
    gap: 2,
  },
  miniStatValue: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  miniStatLabel: {
    color: colors.mutedText,
    fontSize: typography.tiny,
    fontWeight: '600',
  },

  // Next Workout card
  nextCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  nextDateChip: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  nextName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
    marginBottom: 3,
  },
  nextMeta: {
    color: colors.mutedText,
    fontSize: typography.caption,
    marginBottom: spacing.sm,
  },
  nextButton: {
    minHeight: 46,
    borderRadius: radius.md,
  },
});
