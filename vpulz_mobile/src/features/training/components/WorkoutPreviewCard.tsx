import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { AdaptiveWorkoutPlan } from '../../../shared/state/settingsLogic';
import { colors, spacing, typography } from '../../../shared/theme/tokens';
import { AppButton } from '../../../shared/components/ui';

interface Props {
  plan: AdaptiveWorkoutPlan;
  onStart: () => void;
  onQuickStart?: () => void;
  onMove?: () => void;
  onDelete?: () => void;
  onOpenExercise?: (exerciseName: string) => void;
}

export function WorkoutPreviewCard({ plan, onStart, onQuickStart, onMove, onDelete, onOpenExercise }: Props) {
  const highlighted = plan.exercises?.[0] ?? null;
  const list = plan.exercises ?? [];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{plan.title}</Text>
          <Text style={styles.meta}>{`${plan.estimatedDurationMin ?? '—'} min`}</Text>
          {plan.recommendation ? <Text style={styles.micro}>{plan.recommendation}</Text> : null}
        </View>
      </View>

      {highlighted ? (
        <View style={styles.highlight}>
          <Text style={styles.highlightName}>{highlighted.name}</Text>
          <Text style={styles.highlightMeta}>{`${highlighted.targetSets}×${highlighted.targetReps} • ${highlighted.targetWeightKg ?? '—'}kg`}</Text>
        </View>
      ) : null}

      <View style={styles.list}>
        {(list.slice(0, 3) || []).map((ex) => (
          <Pressable key={ex.name} onPress={() => onOpenExercise?.(ex.name)} style={styles.row}>
            <Text style={styles.rowTitle}>{ex.name}</Text>
            <Text style={styles.rowMeta}>{`${ex.targetSets}×${ex.targetReps} • ${ex.targetWeightKg ?? '—'}kg`}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.actionsRow}>
        <AppButton onPress={onStart} style={{ flex: 1 }}>
          Start Workout
        </AppButton>
        <AppButton variant="secondary" onPress={onMove} style={{ marginLeft: 8 }}>
          Move
        </AppButton>
      </View>

      <View style={[styles.actionsRow, { marginTop: 8 }]}>
        <AppButton variant="secondary" onPress={onDelete} style={{ flex: 1 }}>
          Delete
        </AppButton>
        <AppButton variant="secondary" onPress={onQuickStart} style={{ marginLeft: 8 }}>
          Quick Start
        </AppButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
  },
  header: { marginBottom: spacing.sm },
  title: { color: colors.text, fontSize: typography.subtitle, fontWeight: '700' },
  meta: { color: colors.mutedText, fontSize: typography.tiny, marginTop: 2 },
  micro: { color: colors.mutedText, fontSize: typography.caption, marginTop: spacing.xs },
  highlight: { backgroundColor: colors.surfaceStrong, padding: spacing.sm, borderRadius: 10, marginVertical: spacing.sm },
  highlightName: { color: colors.text, fontSize: typography.body, fontWeight: '700' },
  highlightMeta: { color: colors.mutedText, fontSize: typography.tiny, marginTop: 4 },
  list: { marginTop: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  rowTitle: { color: colors.text, fontSize: typography.body },
  rowMeta: { color: colors.mutedText },
  actionsRow: { flexDirection: 'row' },
});

export default WorkoutPreviewCard;
