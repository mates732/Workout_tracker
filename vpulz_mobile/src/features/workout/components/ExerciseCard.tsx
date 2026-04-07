import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SetType, WorkoutExerciseState } from '../../../shared/api/workoutApi';
import type { GeneratedWorkoutExercise } from '../../../shared/state/settingsLogic';
import { AppButton } from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme/tokens';
import SetRow from './SetRow';

type DraftSet = { weight: string; reps: string };

interface Props {
  exercise: WorkoutExerciseState;
  planExercise?: GeneratedWorkoutExercise | null;
  rowCount: number;
  draft: DraftSet;
  getSetType: (rowIndex: number) => SetType;
  onOpenExercise: () => void;
  onChangeDraft: (field: keyof DraftSet, value: string) => void;
  onPressSetType: (rowIndex: number) => void;
  onToggleSet: (rowIndex: number) => Promise<void>;
  onAddSetRow: () => void;
}

function computeActiveRow(exercise: WorkoutExerciseState, rowCount: number): number {
  for (let index = 0; index < rowCount; index += 1) {
    const setItem = exercise.sets[index];
    if (!setItem || !setItem.completed) {
      return index;
    }
  }
  return Math.max(0, rowCount - 1);
}

export const ExerciseCard: React.FC<Props> = ({
  exercise,
  planExercise,
  rowCount,
  draft,
  getSetType,
  onOpenExercise,
  onChangeDraft,
  onPressSetType,
  onToggleSet,
  onAddSetRow,
}) => {
  const completedCount = useMemo(() => exercise.sets.filter((s) => s.completed).length, [exercise.sets]);
  const activeRow = useMemo(() => computeActiveRow(exercise, rowCount), [exercise, rowCount]);
  const plannedSets = planExercise?.targetSets ?? Math.max(1, rowCount);
  const lastCompleted = useMemo(() => {
    for (let index = exercise.sets.length - 1; index >= 0; index -= 1) {
      if (exercise.sets[index].completed) {
        return exercise.sets[index];
      }
    }
    return null;
  }, [exercise.sets]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Pressable style={styles.headerTap} onPress={onOpenExercise}>
            <Text style={styles.title}>{exercise.name}</Text>
          </Pressable>
          <Text style={styles.meta}>{`${completedCount}/${plannedSets}`}</Text>
        </View>

        <Text style={styles.lastText}>{`Last: ${lastCompleted?.weight ?? '-'} x ${lastCompleted?.reps ?? '-'}`}</Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colSet]}>SET</Text>
          <Text style={[styles.tableHeaderText, styles.colPrevious]}>PREVIOUS</Text>
          <Text style={[styles.tableHeaderText, styles.colMetric]}>KG</Text>
          <Text style={[styles.tableHeaderText, styles.colMetric]}>REPS</Text>
          <Text style={[styles.tableHeaderText, styles.colDone]}>✔</Text>
        </View>

        <View style={styles.setsList}>
          {Array.from({ length: rowCount }).map((_, rowIndex) => {
            const setItem = exercise.sets[rowIndex];
            const previousSet = rowIndex > 0 ? exercise.sets[rowIndex - 1] : null;
            const previousLabel = previousSet ? `${previousSet.weight} x ${previousSet.reps}` : '-';
            const isActiveRow = rowIndex === activeRow;
            return (
              <SetRow
                key={`${exercise.id}-row-${rowIndex}`}
                index={rowIndex + 1}
                previousLabel={previousLabel}
                type={getSetType(rowIndex)}
                completed={Boolean(setItem?.completed)}
                active={isActiveRow}
                editable={isActiveRow}
                weight={isActiveRow ? draft.weight : setItem ? String(setItem.weight) : ''}
                reps={isActiveRow ? draft.reps : setItem ? String(setItem.reps) : ''}
                onChangeWeight={(value) => {
                  if (isActiveRow) {
                    onChangeDraft('weight', value);
                  }
                }}
                onChangeReps={(value) => {
                  if (isActiveRow) {
                    onChangeDraft('reps', value);
                  }
                }}
                onPressType={() => onPressSetType(rowIndex)}
                toggleDisabled={!setItem && !isActiveRow}
                onToggleComplete={() => onToggleSet(rowIndex)}
              />
            );
          })}
        </View>

        <View style={styles.rowActions}>
          <AppButton variant="secondary" style={styles.actionBtn} onPress={onAddSetRow}>
            Add Set
          </AppButton>
        </View>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  card: {
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  headerTap: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  meta: {
    color: colors.mutedText,
    fontSize: typography.tiny,
    fontWeight: '700',
  },
  lastText: {
    color: colors.mutedText,
    fontSize: typography.tiny,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    marginTop: spacing.xs,
  },
  tableHeaderText: {
    color: colors.mutedText,
    fontSize: typography.tiny,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  colSet: {
    width: 40,
  },
  colPrevious: {
    flex: 1,
    minWidth: 78,
  },
  colMetric: {
    width: 66,
    textAlign: 'center',
  },
  colDone: {
    width: 36,
    textAlign: 'center',
  },
  setsList: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  rowActions: {
    marginTop: spacing.xs,
  },
  actionBtn: {
    minHeight: 46,
  },
});

export default ExerciseCard;
