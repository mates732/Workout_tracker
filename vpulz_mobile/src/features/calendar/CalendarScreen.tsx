import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkoutFlow } from '../../shared/state/WorkoutFlowContext';
import { colors, spacing, typography, radius } from '../../shared/theme/tokens';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { AppButton } from '../../shared/components/ui';

type LegendItem = {
  key: string;
  label: string;
  color: string;
};

function colorForSplit(split: string) {
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

export function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { plannedWorkouts, settings, setCurrentWorkout } = useWorkoutFlow();

  const days = useMemo(() => {
    return [...plannedWorkouts].sort((a, b) => a.date.localeCompare(b.date));
  }, [plannedWorkouts]);

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]} edges={[]}>
      <View style={styles.container}>
        <Text style={styles.header}>Calendar</Text>
        <Text style={styles.sub}>Preview of planned sessions ({settings.general.calendar_preview_days} days)</Text>
        {/* Dynamic legend: reflects user split settings (colors + labels) */}
        {(() => {
          const legendItems: LegendItem[] = (() => {
            const splitColors = settings?.splitConfig?.colors ?? {};
            const t = settings?.workout?.training_type;

            if (t === 'push_pull_legs') {
              return [
                { key: 'push', label: 'Push', color: splitColors.push ?? colors.primary },
                { key: 'pull', label: 'Pull', color: splitColors.pull ?? colors.primary },
                { key: 'legs', label: 'Legs', color: splitColors.legs ?? colors.primary },
              ];
            }

            if (t === 'split') {
              return [
                { key: 'upper', label: 'Upper', color: colors.primary },
                { key: 'lower', label: 'Lower', color: colors.surfaceStrong },
              ];
            }

            if (t === 'full_body') {
              return [{ key: 'full', label: 'Full Body', color: colors.primary }];
            }

            // custom: show user-defined routine names
            if (t === 'custom') {
              const customColors = settings?.splitConfig?.customColors ?? {};
              const plannedRoutines = [...new Set(plannedWorkouts.map((workout) => String(workout.splitType).trim()).filter(Boolean))];
              const routines = plannedRoutines.length ? plannedRoutines : Object.keys(customColors);
              return routines.map((routine, index) => ({
                key: `custom-${index}`,
                label: routine,
                color: customColors[routine] ?? colors.primary,
              }));
            }

            return [];
          })();

          if (!legendItems.length) return null;

          return (
            <View style={styles.legendRow}>
              {legendItems.map((item) => (
                <View key={item.key} style={styles.legendItem}>
                  <View style={[styles.legendSwatch, { backgroundColor: item.color }]} />
                  <Text style={styles.legendLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          );
        })()}

        <FlatList
          data={days}
          keyExtractor={(item) => item.date}
          renderItem={({ item }) => {
            const exercises = item.preview.exercises ?? [];
            const exCount = exercises.length;
            const dateLabel = new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            const splitColors = settings?.splitConfig?.colors;
            const customColors = settings?.splitConfig?.customColors ?? {};
            let badgeColor = colorForSplit(item.splitType);

            if (splitColors && (item.splitType === 'push' || item.splitType === 'pull' || item.splitType === 'legs')) {
              badgeColor = item.splitType === 'push' ? splitColors.push : item.splitType === 'pull' ? splitColors.pull : splitColors.legs;
            } else if (typeof item.splitType === 'string' && customColors[item.splitType]) {
              badgeColor = customColors[item.splitType];
            }

            return (
              <View style={styles.rowMinimal}>
                <View style={[styles.badge, { backgroundColor: badgeColor }]} />
                <View style={styles.infoMinimal}>
                  <Text style={styles.planTitle}>{item.preview.title}</Text>
                  <Text style={styles.metaLine}>{`${dateLabel} • ${item.preview.estimatedDurationMin ? `${item.preview.estimatedDurationMin} min` : '—'} • ${exCount} exercises`}</Text>

                  {/* Exercises hidden in calendar list to avoid duplicate previews; use Home for full preview */}
                </View>

                <AppButton
                  style={styles.startButton}
                  onPress={() => {
                    try {
                      setCurrentWorkout(item.preview);
                      navigation.navigate('ActiveWorkout');
                    } catch {
                      /* noop */
                    }
                  }}
                >
                  Start
                </AppButton>
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.md },
  header: { color: colors.text, fontSize: typography.title, fontWeight: '700' },
  sub: { color: colors.mutedText, marginBottom: spacing.md },
  legendRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm, marginTop: 8, alignItems: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendSwatch: { width: 14, height: 14, borderRadius: 4, borderWidth: 1, borderColor: colors.border },
  legendLabel: { color: colors.mutedText, fontSize: typography.tiny },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  badge: { width: 18, height: 18, borderRadius: 9 },
  info: { flex: 1 },
  date: { color: colors.mutedText, fontSize: typography.tiny },
  planTitle: { color: colors.text, fontSize: typography.body, fontWeight: '700' },
  planMeta: { color: colors.mutedText, fontSize: typography.caption },
  /* Minimal preview styles */
  rowMinimal: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  infoMinimal: { flex: 1 },
  metaLine: { color: colors.mutedText, fontSize: typography.tiny, marginTop: 4 },
  exerciseListMinimal: { marginTop: 6 },
  exerciseName: { color: colors.text, fontSize: typography.body },
  moreText: { color: colors.mutedText, fontSize: typography.tiny, marginTop: 4 },
  startButton: { minWidth: 84 },
});
