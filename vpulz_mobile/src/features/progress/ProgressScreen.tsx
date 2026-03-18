import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ProgressResponse } from '../../shared/api/workoutApi';
import { AppButton, AppCard, AppChip } from '../../shared/components/ui';
import { useWorkoutFlow } from '../../shared/state/WorkoutFlowContext';
import { colors, radius, spacing, typography } from '../../shared/theme/tokens';

type ExerciseOption = {
  id: number;
  name: string;
};

function calcOneRm(weight: number, reps: number): number {
  return Math.round(weight * (1 + reps / 30));
}

function formatDay(value: string): string {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function BarSeries({
  points,
  color,
  valueKey,
}: {
  points: Array<{ timestamp: string; value: number }>;
  color: string;
  valueKey: string;
}) {
  const peak = Math.max(...points.map((point) => point.value), 1);

  return (
    <View style={styles.seriesWrap}>
      {points.map((point) => {
        const height = Math.max(8, Math.round((point.value / peak) * 82));
        return (
          <View key={`${valueKey}-${point.timestamp}-${point.value}`} style={styles.barItem}>
            <View style={[styles.bar, { height, backgroundColor: color }]} />
            <Text style={styles.barLabel}>{formatDay(point.timestamp)}</Text>
            <Text style={styles.barValue}>{Math.round(point.value)}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function ProgressScreen() {
  const { workoutState, busy, error, clearError, loadExerciseProgress } = useWorkoutFlow();

  const exerciseOptions = useMemo<ExerciseOption[]>(() => {
    const mapped = workoutState?.exercises.map((exercise) => ({
      id: exercise.exercise_id,
      name: exercise.name,
    }));

    return mapped ?? [];
  }, [workoutState?.exercises]);

  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);

  useEffect(() => {
    if (selectedExerciseId || !exerciseOptions.length) {
      return;
    }
    setSelectedExerciseId(exerciseOptions[0].id);
  }, [exerciseOptions, selectedExerciseId]);

  useEffect(() => {
    if (!selectedExerciseId) {
      return;
    }

    let mounted = true;
    void (async () => {
      const data = await loadExerciseProgress(selectedExerciseId);
      if (mounted) {
        setProgress(data);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [loadExerciseProgress, selectedExerciseId]);

  const completedSets = useMemo(() => {
    return (workoutState?.exercises ?? []).flatMap((exercise) =>
      exercise.sets.filter((setItem) => setItem.completed)
    );
  }, [workoutState?.exercises]);

  const totalVolume = useMemo(() => {
    return completedSets.reduce((sum, item) => sum + item.weight * item.reps, 0);
  }, [completedSets]);

  const estimated1RM = useMemo(() => {
    const best = [...completedSets].sort((a, b) => b.weight - a.weight || b.reps - a.reps)[0];
    if (!best) {
      return 0;
    }
    return calcOneRm(best.weight, best.reps);
  }, [completedSets]);

  const chartWeightPoints = useMemo(() => {
    return (progress?.weight_over_time ?? []).map((item) => ({
      timestamp: item.timestamp,
      value: item.weight,
    }));
  }, [progress?.weight_over_time]);

  const chartVolumePoints = useMemo(() => {
    return (progress?.volume_trend ?? []).map((item) => ({
      timestamp: item.timestamp,
      value: item.volume,
    }));
  }, [progress?.volume_trend]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View>
          <Text style={styles.pageTitle}>Analytics</Text>
          <Text style={styles.pageSubtitle}>Training insights with clean chart data</Text>
        </View>

        {error ? (
          <AppCard style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <AppButton variant="secondary" onPress={clearError}>
              Dismiss
            </AppButton>
          </AppCard>
        ) : null}

        <View style={styles.kpiGrid}>
          <AppCard style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Estimated 1RM</Text>
            <Text style={styles.kpiValue}>{estimated1RM} kg</Text>
          </AppCard>
          <AppCard style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Session Volume</Text>
            <Text style={styles.kpiValue}>{Math.round(totalVolume)}</Text>
          </AppCard>
        </View>

        <AppCard>
          <Text style={styles.cardTitle}>Exercise Focus</Text>
          <View style={styles.chipsRow}>
            {exerciseOptions.map((option) => (
              <AppChip
                key={option.id}
                label={option.name}
                selected={selectedExerciseId === option.id}
                onPress={() => setSelectedExerciseId(option.id)}
              />
            ))}
          </View>
          <Text style={styles.metaText}>{busy ? 'Loading trends...' : progress?.exercise_name ?? 'No data yet'}</Text>
        </AppCard>

        <AppCard>
          <Text style={styles.cardTitle}>Weight Trend</Text>
          {chartWeightPoints.length ? (
            <BarSeries points={chartWeightPoints} color={colors.primary} valueKey="weight" />
          ) : (
            <Text style={styles.emptyText}>Log a few sessions to unlock this graph.</Text>
          )}
        </AppCard>

        <AppCard>
          <Text style={styles.cardTitle}>Volume Trend</Text>
          {chartVolumePoints.length ? (
            <BarSeries points={chartVolumePoints} color="#57B0FF" valueKey="volume" />
          ) : (
            <Text style={styles.emptyText}>Volume data will appear after your first workout.</Text>
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
  scroll: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 110,
  },
  pageTitle: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '700',
  },
  pageSubtitle: {
    color: colors.mutedText,
    marginTop: 2,
    fontSize: typography.body,
  },
  errorCard: {
    backgroundColor: '#3A1F2A',
    borderColor: '#5A2A38',
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.body,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  kpiCard: {
    flex: 1,
    gap: 6,
  },
  kpiLabel: {
    color: colors.mutedText,
    fontSize: typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiValue: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  metaText: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  seriesWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingTop: 4,
  },
  barItem: {
    width: 36,
    alignItems: 'center',
    gap: 4,
  },
  bar: {
    width: 24,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
    shadowColor: colors.glow,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 1,
  },
  barLabel: {
    color: colors.mutedText,
    fontSize: typography.tiny,
  },
  barValue: {
    color: colors.text,
    fontSize: typography.tiny,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.mutedText,
    fontSize: typography.body,
  },
});
