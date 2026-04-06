import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import type { WorkoutSet } from '../types/workout';

export type SetTypeTag = 'normal' | 'warmup' | 'failure' | 'dropset';

type SetRowProps = {
  index: number;
  setItem: WorkoutSet;
  previousLabel?: string;
  setType?: SetTypeTag;
  rirLabel?: string | null;
  onChangeWeight: (next: number) => void;
  onChangeReps: (next: number) => void;
  onToggleComplete: () => void;
  onPressSetType: () => void;
  onLongPressMetric: (field: 'weight' | 'reps') => void;
  onDelete: () => void;
};

function parseWeightInput(value: string): number {
  const parsed = Number.parseFloat(value.replace(',', '.'));
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, parsed);
}

function parseRepsInput(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, parsed);
}

function getSetChipLabel(index: number, setType: SetTypeTag): string {
  if (setType === 'warmup') {
    return 'W';
  }
  if (setType === 'failure') {
    return 'F';
  }
  if (setType === 'dropset') {
    return 'D';
  }
  return String(index + 1);
}

export const SetRow = memo(function SetRow({
  index,
  setItem,
  previousLabel = '-',
  setType = 'normal',
  rirLabel,
  onChangeWeight,
  onChangeReps,
  onToggleComplete,
  onPressSetType,
  onLongPressMetric,
  onDelete,
}: SetRowProps) {
  const swipeRef = useRef<Swipeable | null>(null);
  const [weightValue, setWeightValue] = useState(String(setItem.weight));
  const [repsValue, setRepsValue] = useState(String(setItem.reps));

  useEffect(() => {
    setWeightValue(String(setItem.weight));
  }, [setItem.weight]);

  useEffect(() => {
    setRepsValue(String(setItem.reps));
  }, [setItem.reps]);

  const setChipLabel = useMemo(() => getSetChipLabel(index, setType), [index, setType]);

  const onWeightChange = (text: string) => {
    const sanitized = text.replace(/[^0-9.,]/g, '');
    setWeightValue(sanitized);
    onChangeWeight(parseWeightInput(sanitized));
  };

  const onRepsChange = (text: string) => {
    const sanitized = text.replace(/[^0-9]/g, '');
    setRepsValue(sanitized);
    onChangeReps(parseRepsInput(sanitized));
  };

  const renderRightAction = () => (
    <View style={styles.deleteActionWrap}>
      <Text style={styles.deleteActionText}>Delete</Text>
    </View>
  );

  return (
    <Swipeable
      ref={swipeRef}
      overshootRight={false}
      renderRightActions={renderRightAction}
      onSwipeableOpen={(direction) => {
        if (direction === 'right') {
          onDelete();
          swipeRef.current?.close();
        }
      }}
    >
      <View style={[styles.row, setItem.completed ? styles.rowCompleted : null]}>
        <Pressable style={styles.setCell} onPress={onPressSetType} accessibilityRole="button">
          <Text style={[styles.setCellText, setType !== 'normal' ? styles.setCellTextSpecial : null]}>{setChipLabel}</Text>
        </Pressable>

        <View style={styles.previousCell}>
          <Text style={styles.previousText} numberOfLines={1}>
            {previousLabel}
          </Text>
        </View>

        <Pressable style={styles.inputCell} onLongPress={() => onLongPressMetric('weight')} delayLongPress={240}>
          <TextInput
            value={weightValue}
            onChangeText={onWeightChange}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#6B7280"
            style={styles.input}
          />
          {rirLabel ? <Text style={styles.rirChip}>{`RIR ${rirLabel}`}</Text> : null}
        </Pressable>

        <Pressable style={styles.inputCell} onLongPress={() => onLongPressMetric('reps')} delayLongPress={240}>
          <TextInput
            value={repsValue}
            onChangeText={onRepsChange}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#6B7280"
            style={styles.input}
          />
        </Pressable>

        <Pressable
          style={[styles.checkCell, setItem.completed ? styles.checkCellActive : null]}
          onPress={onToggleComplete}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: setItem.completed }}
        >
          <Text style={[styles.checkText, setItem.completed ? styles.checkTextActive : null]}>{setItem.completed ? '✓' : ''}</Text>
        </Pressable>
      </View>
    </Swipeable>
  );
});

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: '#111111',
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowCompleted: {
    borderColor: 'rgba(34, 197, 94, 0.45)',
    backgroundColor: 'rgba(22, 34, 25, 0.95)',
  },
  setCell: {
    width: 44,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b0b0b',
  },
  setCellText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  setCellTextSpecial: {
    color: '#0A84FF',
  },
  previousCell: {
    flex: 1,
    minWidth: 68,
    paddingHorizontal: 2,
  },
  previousText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  inputCell: {
    width: 68,
    minHeight: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: '#0b0b0b',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  input: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: 0,
    textAlign: 'center',
  },
  rirChip: {
    color: '#9CA3AF',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 1,
  },
  checkCell: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b0b0b',
  },
  checkCellActive: {
    borderColor: '#16A34A',
    backgroundColor: '#16A34A',
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 16,
  },
  checkTextActive: {
    color: '#FFFFFF',
  },
  deleteActionWrap: {
    width: 88,
    borderRadius: 16,
    marginLeft: 8,
    backgroundColor: '#991B1B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default SetRow;
