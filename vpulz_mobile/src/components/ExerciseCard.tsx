import { Ionicons } from '@expo/vector-icons';
import { memo, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import SetRow, { type SetTypeTag } from './SetRow';
import type { WorkoutExercise, WorkoutSet } from '../types/workout';

export type SetPatch = Partial<Pick<WorkoutSet, 'reps' | 'weight' | 'completed' | 'note'>>;

type ExerciseCardProps = {
  exercise: WorkoutExercise;
  readOnly?: boolean;
  previousHint?: string;
  setTypesBySetId?: Record<string, SetTypeTag>;
  rirBySetId?: Record<string, string>;
  reorderMode?: boolean;
  onOpenExerciseDetail?: () => void;
  onOpenExerciseMenu?: () => void;
  onToggleExpand?: () => void;
  onAddSet?: () => void;
  onRemoveSet?: (setId: string) => void;
  onUpdateSet?: (setId: string, patch: SetPatch) => void;
  onSetTypePress?: (setId: string) => void;
  onLongPressMetric?: (setId: string, field: 'weight' | 'reps') => void;
  onUpdateNotes?: (notes: string) => void;
  onPressRestTimer?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
};

function getInlinePreviousLabel(exercise: WorkoutExercise, setIndex: number): string {
  if (setIndex <= 0) {
    return '-';
  }
  const prev = exercise.sets[setIndex - 1];
  if (!prev) {
    return '-';
  }
  return `${prev.weight} x ${prev.reps}`;
}

export const ExerciseCard = memo(function ExerciseCard({
  exercise,
  readOnly = false,
  previousHint,
  setTypesBySetId,
  rirBySetId,
  reorderMode = false,
  onOpenExerciseDetail,
  onOpenExerciseMenu,
  onToggleExpand,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onSetTypePress,
  onLongPressMetric,
  onUpdateNotes,
  onPressRestTimer,
  onMoveUp,
  onMoveDown,
}: ExerciseCardProps) {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState(exercise.notes ?? '');

  useEffect(() => {
    setNoteDraft(exercise.notes ?? '');
  }, [exercise.notes]);

  const completedCount = useMemo(() => exercise.sets.filter((setItem) => setItem.completed).length, [exercise.sets]);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.exerciseThumb}>
          <Ionicons name="barbell-outline" size={16} color="#9CA3AF" />
        </View>

        <View style={styles.titleWrap}>
          <Pressable onPress={onOpenExerciseDetail} hitSlop={8}>
            <Text style={styles.title}>{exercise.name}</Text>
          </Pressable>
          <Text style={styles.meta}>{`${completedCount}/${Math.max(1, exercise.sets.length)} sets`}</Text>
        </View>

        {!readOnly ? (
          <Pressable style={styles.iconButton} onPress={onOpenExerciseMenu} hitSlop={8}>
            <Ionicons name="ellipsis-horizontal" size={18} color="#9CA3AF" />
          </Pressable>
        ) : null}
      </View>

      {!exercise.expanded ? (
        <Pressable style={styles.expandRow} onPress={onToggleExpand}>
          <Text style={styles.expandText}>Show sets</Text>
        </Pressable>
      ) : (
        <View style={styles.contentWrap}>
          {isEditingNote && !readOnly ? (
            <TextInput
              value={noteDraft}
              onChangeText={setNoteDraft}
              onBlur={() => {
                onUpdateNotes?.(noteDraft.trim());
                setIsEditingNote(false);
              }}
              placeholder="Add notes here..."
              placeholderTextColor="#9CA3AF"
              multiline
              autoFocus
              style={styles.noteInput}
            />
          ) : (
            <Pressable onPress={() => (!readOnly ? setIsEditingNote(true) : undefined)} hitSlop={8}>
              <Text style={styles.noteText}>{exercise.notes?.trim().length ? exercise.notes : 'Add notes here...'}</Text>
            </Pressable>
          )}

          {!readOnly ? (
            <Pressable style={styles.restRow} onPress={onPressRestTimer}>
              <Text style={styles.restText}>Rest Timer: OFF</Text>
            </Pressable>
          ) : null}

          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colSet]}>SET</Text>
            <Text style={[styles.tableHeaderText, styles.colPrev]}>PREVIOUS</Text>
            <Text style={[styles.tableHeaderText, styles.colKg]}>KG</Text>
            <Text style={[styles.tableHeaderText, styles.colReps]}>REPS</Text>
            <Text style={[styles.tableHeaderText, styles.colDone]}>✔</Text>
          </View>

          <View style={styles.rowsWrap}>
            {exercise.sets.map((setItem, setIndex) => {
              const previousLabel = previousHint ?? getInlinePreviousLabel(exercise, setIndex);

              if (readOnly) {
                return (
                  <View key={setItem.id} style={styles.readOnlySetRow}>
                    <Text style={[styles.readOnlySetCell, styles.colSet]}>{setIndex + 1}</Text>
                    <Text style={[styles.readOnlySetCell, styles.colPrev]} numberOfLines={1}>
                      {previousLabel}
                    </Text>
                    <Text style={[styles.readOnlySetCell, styles.colKg]}>{setItem.weight}</Text>
                    <Text style={[styles.readOnlySetCell, styles.colReps]}>{setItem.reps}</Text>
                    <Text style={[styles.readOnlySetCell, styles.colDone]}>{setItem.completed ? '✓' : ''}</Text>
                  </View>
                );
              }

              return (
                <SetRow
                  key={setItem.id}
                  index={setIndex}
                  setItem={setItem}
                  previousLabel={previousLabel}
                  setType={setTypesBySetId?.[setItem.id] ?? 'normal'}
                  rirLabel={rirBySetId?.[setItem.id] ?? null}
                  onChangeWeight={(next) => onUpdateSet?.(setItem.id, { weight: next })}
                  onChangeReps={(next) => onUpdateSet?.(setItem.id, { reps: next })}
                  onToggleComplete={() => onUpdateSet?.(setItem.id, { completed: !setItem.completed })}
                  onPressSetType={() => onSetTypePress?.(setItem.id)}
                  onLongPressMetric={(field) => onLongPressMetric?.(setItem.id, field)}
                  onDelete={() => onRemoveSet?.(setItem.id)}
                />
              );
            })}
          </View>

          {!readOnly ? (
            <Pressable style={styles.addSetButton} onPress={onAddSet}>
              <Text style={styles.addSetLabel}>Add Set</Text>
            </Pressable>
          ) : null}

          {reorderMode && !readOnly ? (
            <View style={styles.reorderRow}>
              <Pressable style={styles.reorderButton} onPress={onMoveUp}>
                <Text style={styles.reorderButtonLabel}>Move Up</Text>
              </Pressable>
              <Pressable style={styles.reorderButton} onPress={onMoveDown}>
                <Text style={styles.reorderButtonLabel}>Move Down</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: '#111111',
    padding: 14,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exerciseThumb: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: '#0B0B0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: '#0A84FF',
    fontSize: 17,
    fontWeight: '700',
  },
  meta: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: '#0B0B0B',
  },
  expandRow: {
    minHeight: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  expandText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  contentWrap: {
    gap: 10,
  },
  noteText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  noteInput: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: '#0B0B0B',
    color: '#FFFFFF',
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  restRow: {
    minHeight: 34,
    justifyContent: 'center',
  },
  restText: {
    color: '#0A84FF',
    fontSize: 12,
    fontWeight: '600',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tableHeaderText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  colSet: {
    width: 44,
  },
  colPrev: {
    flex: 1,
  },
  colKg: {
    width: 68,
    textAlign: 'center',
  },
  colReps: {
    width: 68,
    textAlign: 'center',
  },
  colDone: {
    width: 36,
    textAlign: 'center',
  },
  rowsWrap: {
    gap: 8,
  },
  readOnlySetRow: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: '#0B0B0B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  readOnlySetCell: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  addSetButton: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B0B0B',
  },
  addSetLabel: {
    color: '#0A84FF',
    fontSize: 14,
    fontWeight: '700',
  },
  reorderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  reorderButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: '#0B0B0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderButtonLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ExerciseCard;
