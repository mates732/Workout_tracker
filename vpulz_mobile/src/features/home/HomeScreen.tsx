import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MainTabsParamList } from '../../navigation/MainTabs';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { AppButton, AppCard } from '../../shared/components/ui';
import { useDeviceReader } from '../../shared/device/useDeviceReader';
import { useWorkoutFlow } from '../../shared/state/WorkoutFlowContext';
import { generateFeedback } from '../../shared/state/settingsLogic';
import type { PlannedWorkout, AdaptiveWorkoutPlan } from '../../shared/state/settingsLogic';
import { colors, radius, spacing, typography } from '../../shared/theme/tokens';

type HomeNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function formatVolume(volume: number): string {
  return `${Math.round(volume).toLocaleString()} kg`;
}

function formatSettingLabel(value: string): string {
  return value.replace(/_/g, ' ');
}

function toIsoDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function addDays(base: Date, offset: number): Date {
  const next = new Date(base);
  next.setDate(base.getDate() + offset);
  return next;
}

function dotColorForPerformance(performance: number): string {
  if (performance > 1) {
    return colors.success;
  }
  if (performance < 0.8) {
    return colors.danger;
  }
  return colors.planned;
}

function colorForSplitType(split?: string): string {
  switch (split) {
    case 'push':
      return '#FB923C';
    case 'pull':
      return '#06B6D4';
    case 'legs':
      return '#A78BFA';
    case 'upper':
      return '#F59E0B';
    case 'lower':
      return '#10B981';
    case 'full':
    default:
      return '#FBBF24';
  }
}

export function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const insets = useSafeAreaInsets();
  const { horizontalGutter } = useDeviceReader();
  const {
    startOrResumeWorkout,
    setCurrentWorkout,
    currentWorkout,
    settings,
    workoutPlan,
    plannedWorkouts,
    workoutHistory,
    lastWorkoutSummary,
  } = useWorkoutFlow();

  const workoutPreview = currentWorkout?.plan ?? workoutPlan;

  const startWorkout = () => {
    try {
      startOrResumeWorkout();
      navigation.navigate('ActiveWorkout');
    } catch {
      // WorkoutFlowContext exposes the latest error banner globally inside the flow.
    }
  };

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const plannedByDate = useMemo(() => {
    return new Map(plannedWorkouts.map((item) => [item.date, item] as const));
  }, [plannedWorkouts]);

  const historyByDate = useMemo(() => {
    const map = new Map<string, typeof workoutHistory[number]>();
    workoutHistory.forEach((item) => {
      const date = item.completedAt.slice(0, 10);
      if (!map.has(date)) {
        map.set(date, item);
      }
    });
    return map;
  }, [workoutHistory]);

  const calendarDays = useMemo(() => {
    const days = settings?.general?.calendar_preview_days ?? 14;
    const half = Math.floor(days / 2);
    const start = addDays(today, -half);
    return Array.from({ length: days }, (_, index) => addDays(start, index));
  }, [today, settings?.general?.calendar_preview_days]);

  const [previewDate, setPreviewDate] = useState<string | null>(null);
  const [selectedExerciseName, setSelectedExerciseName] = useState<string | null>(null);
  const [selectedExercisePlan, setSelectedExercisePlan] = useState<AdaptiveWorkoutPlan | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<PlannedWorkout | null>(null);

  const compactDays = useMemo(() => {
    const nowTime = today.getTime();
    return plannedWorkouts
      .map((p) => ({ ...p, time: new Date(p.date).getTime() }))
      .filter((p) => p.time >= nowTime)
      .slice(0, 7);
  }, [plannedWorkouts, today]);

  const onStartPlanned = (planned: PlannedWorkout) => {
    try {
      setCurrentWorkout(planned.preview);
      navigation.navigate('ActiveWorkout');
    } catch {
      // WorkoutFlowContext exposes the latest error banner globally inside the flow.
    }
  };

  const openWorkoutDetail = (summary: typeof workoutHistory[number]) => {
    navigation.navigate('WorkoutSummary', {
      summary,
      nextPlan: null,
    });
  };

  const heroExercises = workoutPreview?.exercises ?? [];
  const heroTop = heroExercises.slice(0, 3);
  const heroExCount = heroExercises.length;
  const heroDateLabel = today.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  // Debug hook to confirm which preview is rendered at runtime
  // eslint-disable-next-line no-console
  console.log('PREVIEW RENDERED HERE');

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}> 
      <View style={{ padding: 16, flex: 1 }}>

        <Text style={{ fontSize: 22, fontWeight: '600', color: 'white' }}>
          {workoutPreview?.title ?? 'No workout scheduled'}
        </Text>

        <Text style={{ color: '#aaa', marginTop: 4 }}>
          {heroDateLabel} • {workoutPreview?.estimatedDurationMin ?? '—'} min • {heroExercises.length} exercises
        </Text>

        <View style={{ marginTop: 16 }}>
          {heroExercises.slice(0, 3).map((ex, i) => (
            <Text key={i} style={{ color: 'white', marginBottom: 6 }}>
              {ex.name}
            </Text>
          ))}

          {heroExercises.length > 3 && (
            <Text style={{ color: '#888' }}>
              +{heroExercises.length - 3} more
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={{
            marginTop: 20,
            backgroundColor: 'white',
            padding: 14,
            borderRadius: 12,
            alignItems: 'center',
          }}
          onPress={startWorkout}
        >
          <Text style={{ color: 'black', fontWeight: '600' }}>
            Start Workout
          </Text>
        </TouchableOpacity>

        {/* Calendar (click a day to preview planned workout) */}
        <View style={{ marginTop: 20 }}>
          <Text style={styles.cardLabel}>Calendar</Text>
          <View style={styles.calendarGrid}>
            {calendarDays.map((date) => {
              const isoDate = toIsoDateOnly(date);
              const completed = historyByDate.get(isoDate);
              const planned = plannedByDate.get(isoDate);
              const hasWorkout = Boolean(completed || planned);

              return (
                <View key={isoDate} style={styles.calendarCellWrapper}>
                  <TouchableOpacity
                    onPress={() => {
                      if (planned) {
                        setSelectedWorkout(planned);
                      } else if (completed) {
                        openWorkoutDetail(completed);
                      }
                    }}
                    disabled={!hasWorkout}
                    style={[styles.calendarCell, !hasWorkout && { opacity: 0.45 }]}
                  >
                    <View style={styles.dayContainer}>
                      {hasWorkout && (
                        <View
                          style={[
                            styles.circleBehind,
                            { backgroundColor: completed ? '#166534' : '#4ade80' },
                          ]}
                        />
                      )}
                      <Text style={[styles.calendarDayNumber, hasWorkout && styles.calendarDayNumberOnTop]}>{date.getDate()}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

      </View>

      {/* Preview overlay: render only when a day is selected */}
      {selectedWorkout && (
        <View style={styles.overlay}>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.cardTitle}>{selectedWorkout.preview.title}</Text>
              <AppButton variant="secondary" style={styles.smallCloseButton} onPress={() => setSelectedWorkout(null)}>
                Close
              </AppButton>
            </View>

            <Text style={styles.previewMetaLine}>{`${new Date(selectedWorkout.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • ${selectedWorkout.preview.estimatedDurationMin ? `${selectedWorkout.preview.estimatedDurationMin} min` : '—'} • ${selectedWorkout.preview.exercises?.length ?? 0} exercises`}</Text>

            <View style={styles.exerciseList}>
              {selectedWorkout.preview.exercises?.slice(0, 3).map((ex, i) => (
                <Text key={i} style={styles.cardBody}>{ex.name}</Text>
              ))}

              {(selectedWorkout.preview.exercises?.length ?? 0) > 3 && (
                <Text style={styles.moreText}>+{(selectedWorkout.preview.exercises?.length ?? 0) - 3} more</Text>
              )}
            </View>

            <View style={styles.previewActions}>
              <AppButton style={styles.startPreviewButton} onPress={() => { onStartPlanned(selectedWorkout); setSelectedWorkout(null); }}>
                Start Workout
              </AppButton>
              <AppButton variant="secondary" style={styles.closePreviewButton} onPress={() => setSelectedWorkout(null)}>
                Close
              </AppButton>
            </View>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 108,
  },
  header: {
    gap: 6,
  },
  eyebrow: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: typography.body,
    lineHeight: 22,
  },
  heroCard: {
    borderColor: '#3A3A3A',
    padding: spacing.md,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCellWrapper: {
    flexBasis: '14.2857%',
    maxWidth: '14.2857%',
    padding: spacing.xs / 2,
  },
  calendarCell: {
    width: '100%',
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  calendarCellToday: {
    borderColor: colors.primary,
  },
  calendarCellPressed: {
    opacity: 0.85,
  },
  calendarDayNumber: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  dayContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 44,
  },
  circleBehind: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success,
    opacity: 0.3,
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -14 },
      { translateY: -14 },
    ],
    zIndex: 0,
  },
  calendarDayNumberOnTop: {
    zIndex: 1,
  },
  plannedLabel: {
    color: colors.mutedText,
    fontSize: typography.tiny,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  calendarSpacer: {
    height: 10,
  },
  compactCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated,
    padding: spacing.sm,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  compactItem: {
    minWidth: 64,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
  },
  compactBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  compactDay: {
    color: colors.mutedText,
    fontSize: typography.tiny,
    fontWeight: '700',
  },
  compactDate: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  viewCalendarButton: {
    marginLeft: spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewCalendarText: { color: colors.text, fontWeight: '700' },
  splitBadge: { width: 12, height: 12, borderRadius: 6 },
  plannedRow: { alignItems: 'center' },
  overlay: { flex: 1, backgroundColor: '#00000099', alignItems: 'center', justifyContent: 'center', padding: 20 },
  previewCard: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: colors.backgroundElevated,
    padding: spacing.md,
    gap: spacing.sm,
  },
  exerciseList: { gap: 6 },
  exerciseItem: { color: colors.mutedText, fontSize: typography.tiny },
  previewActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  startPreviewButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignSelf: 'stretch',
  },
  startPreviewText: { color: colors.primaryText, fontWeight: '700' },
  closePreviewButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
  },
  closePreviewText: { color: colors.text, fontWeight: '700' },
  smallCloseButton: {
    minHeight: 36,
    paddingHorizontal: 10,
    alignSelf: 'flex-end',
    borderRadius: 10,
  },
  previewMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  previewMetaText: { color: colors.mutedText, fontSize: typography.tiny },
  previewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  previewMetaLine: { color: colors.mutedText, fontSize: typography.tiny, marginTop: spacing.xs, marginBottom: spacing.xs },
  /* Hero preview */
  exerciseListMinimal: { marginTop: spacing.sm, gap: 6 },
  exerciseItemMinimal: { color: colors.text, fontSize: typography.body },
  moreText: { color: colors.mutedText, fontSize: typography.tiny, marginTop: spacing.xs },
  bottomSheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066' },
  bottomSheet: {
    backgroundColor: colors.backgroundElevated,
    padding: spacing.md,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  bottomSheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  primaryCta: {
    minHeight: 58,
  },
  cardLabel: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '700',
    lineHeight: 28,
  },
  cardBody: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
  },
  cardMeta: {
    color: colors.mutedText,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metric: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated,
    padding: spacing.sm,
    gap: 4,
  },
  metricValue: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  metricLabel: {
    color: colors.mutedText,
    fontSize: typography.tiny,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated,
    padding: spacing.sm,
  },
  historyCopy: {
    flex: 1,
    gap: 4,
  },
  historyTitle: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  historyMeta: {
    color: colors.mutedText,
    fontSize: typography.tiny,
    lineHeight: 16,
  },
  historyScore: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
});
