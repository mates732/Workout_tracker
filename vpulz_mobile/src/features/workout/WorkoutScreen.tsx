import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState as NativeAppState, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { AppButton, AppCard, AppInput, StickyActionBar } from '../../shared/components/ui';
import { useDeviceReader } from '../../shared/device/useDeviceReader';
import { useWorkoutFlow } from '../../shared/state/WorkoutFlowContext';
import type { SetType, WorkoutExerciseState } from '../../shared/api/workoutApi';
import { colors, spacing, typography } from '../../shared/theme/tokens';
import ExerciseCard from './components/ExerciseCard';

type WorkoutNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type DraftSet = {
  weight: string;
  reps: string;
};

const SET_TYPE_OPTIONS: Array<{ value: SetType; label: string }> = [
  { value: 'normal', label: 'Normal' },
  { value: 'warmup', label: 'W (Warm-up)' },
  { value: 'pr', label: 'P (PR attempt)' },
  { value: 'drop', label: 'D (Drop set)' },
  { value: 'failure', label: 'F (Failure)' },
];

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function parsePositiveFloat(value: string): number {
  const parsed = Number.parseFloat(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function parsePositiveInt(value: string): number {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
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

export function WorkoutScreen() {
  const navigation = useNavigation<WorkoutNavigationProp>();
  const insets = useSafeAreaInsets();
  const { horizontalGutter } = useDeviceReader();
  const {
    currentWorkout,
    elapsedSeconds,
    timerState,
    latestSetSuggestion,
    aiCoachSettings,
    error,
    clearError,
    startEmptyWorkout,
    finishActiveWorkout,
    resetActiveWorkout,
    completeActiveWorkoutLocal,
    logSetForActiveWorkout,
    patchSetLog,
    minimizeWorkout,
    workoutHistory,
  } = useWorkoutFlow();

  const [draftsByExercise, setDraftsByExercise] = useState<Record<string, DraftSet>>({});
  const [rowCountByExercise, setRowCountByExercise] = useState<Record<string, number>>({});
  const [setTypesByExercise, setSetTypesByExercise] = useState<Record<string, Record<number, SetType>>>({});

  const [selectedExerciseName, setSelectedExerciseName] = useState<string | null>(null);
  const [setTypePicker, setSetTypePicker] = useState<{ exerciseId: string; rowIndex: number } | null>(null);

  const [restDurationSec, setRestDurationSec] = useState(60);
  const [restRemainingSec, setRestRemainingSec] = useState(60);
  const [restRunning, setRestRunning] = useState(false);
  const [restPickerOpen, setRestPickerOpen] = useState(false);
  const [customRestInput, setCustomRestInput] = useState('75');

  const exercises = useMemo(() => {
    const list = currentWorkout?.state?.exercises ?? [];
    return [...list].sort((a, b) => a.ordering - b.ordering);
  }, [currentWorkout?.state?.exercises]);

  const getPlannedSets = useCallback(
    (exercise: WorkoutExerciseState): number => {
      const plannedExercise =
        currentWorkout?.plan?.exercises?.find((item) => item.name.toLowerCase() === exercise.name.toLowerCase()) ?? null;
      return Math.max(plannedExercise?.targetSets ?? 0, exercise.sets.length, 1);
    },
    [currentWorkout?.plan?.exercises]
  );

  const totalRows = useMemo(
    () => exercises.reduce((sum, exercise) => sum + (rowCountByExercise[exercise.id] ?? getPlannedSets(exercise)), 0),
    [exercises, getPlannedSets, rowCountByExercise]
  );

  const completedSets = useMemo(
    () => exercises.reduce((sum, exercise) => sum + exercise.sets.filter((setItem) => setItem.completed).length, 0),
    [exercises]
  );

  const progress = Math.min(1, completedSets / Math.max(1, totalRows));

  const totalVolume = useMemo(
    () =>
      exercises.reduce(
        (sum, exercise) =>
          sum +
          exercise.sets
            .filter((setItem) => setItem.completed)
            .reduce((setSum, setItem) => setSum + setItem.weight * setItem.reps, 0),
        0
      ),
    [exercises]
  );

  const coachTitle =
    aiCoachSettings.style === 'strict'
      ? 'Strict Coach'
      : aiCoachSettings.style === 'neutral'
      ? 'Coach Note'
      : 'Motivation Boost';

  const startRestTimer = useCallback((seconds: number) => {
    setRestDurationSec(seconds);
    setRestRemainingSec(seconds);
    setRestRunning(true);
  }, []);

  useEffect(() => {
    if (!restRunning) {
      return;
    }

    if (restRemainingSec <= 0) {
      setRestRunning(false);
      return;
    }

    const timer = setTimeout(() => {
      setRestRemainingSec((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [restRemainingSec, restRunning]);

  useEffect(() => {
    const subscription = NativeAppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        setRestRunning(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (currentWorkout) {
      return;
    }
    startEmptyWorkout();
  }, [currentWorkout, startEmptyWorkout]);

  useEffect(() => {
    setDraftsByExercise((current) => {
      const next = { ...current };
      let changed = false;

      exercises.forEach((exercise) => {
        if (next[exercise.id]) {
          return;
        }

        const lastSet = exercise.sets[exercise.sets.length - 1];
        next[exercise.id] = {
          weight: String(lastSet?.weight ?? 20),
          reps: String(lastSet?.reps ?? 8),
        };
        changed = true;
      });

      return changed ? next : current;
    });

    setRowCountByExercise((current) => {
      const next = { ...current };
      let changed = false;

      exercises.forEach((exercise) => {
        const baseline = getPlannedSets(exercise);
        if (!next[exercise.id] || next[exercise.id] < baseline) {
          next[exercise.id] = baseline;
          changed = true;
        }
      });

      Object.keys(next).forEach((exerciseId) => {
        if (!exercises.some((exercise) => exercise.id === exerciseId)) {
          delete next[exerciseId];
          changed = true;
        }
      });

      return changed ? next : current;
    });

    setSetTypesByExercise((current) => {
      const next = { ...current };
      let changed = false;

      exercises.forEach((exercise) => {
        const existing = next[exercise.id] ?? {};
        const nextForExercise = { ...existing };
        let exerciseChanged = false;

        exercise.sets.forEach((setItem, rowIndex) => {
          if (!nextForExercise[rowIndex] && setItem.set_type) {
            nextForExercise[rowIndex] = setItem.set_type;
            exerciseChanged = true;
          }
        });

        if (exerciseChanged || !next[exercise.id]) {
          next[exercise.id] = nextForExercise;
          changed = true;
        }
      });

      return changed ? next : current;
    });
  }, [exercises, getPlannedSets]);

  const setDraftValue = useCallback((exerciseId: string, field: keyof DraftSet, value: string) => {
    const sanitized = field === 'weight' ? value.replace(/[^0-9.,]/g, '') : value.replace(/[^0-9]/g, '');
    setDraftsByExercise((current) => ({
      ...current,
      [exerciseId]: {
        weight: field === 'weight' ? sanitized : current[exerciseId]?.weight ?? '20',
        reps: field === 'reps' ? sanitized : current[exerciseId]?.reps ?? '8',
      },
    }));
  }, []);

  const getSetType = useCallback(
    (exercise: WorkoutExerciseState, rowIndex: number): SetType => {
      return setTypesByExercise[exercise.id]?.[rowIndex] ?? exercise.sets[rowIndex]?.set_type ?? 'normal';
    },
    [setTypesByExercise]
  );

  const addSetRow = useCallback((exercise: WorkoutExerciseState) => {
    setRowCountByExercise((current) => ({
      ...current,
      [exercise.id]: Math.max(current[exercise.id] ?? 1, exercise.sets.length, 1) + 1,
    }));

    const lastSet = exercise.sets[exercise.sets.length - 1];
    if (lastSet) {
      setDraftsByExercise((current) => ({
        ...current,
        [exercise.id]: {
          weight: String(lastSet.weight),
          reps: String(lastSet.reps),
        },
      }));
    }
  }, []);

  const toggleOrAddSet = useCallback(
    async (exercise: WorkoutExerciseState, rowIndex: number) => {
      const draft = draftsByExercise[exercise.id] ?? { weight: '20', reps: '8' };
      const draftWeight = parsePositiveFloat(draft.weight);
      const draftReps = parsePositiveInt(draft.reps);
      const rowCount = rowCountByExercise[exercise.id] ?? getPlannedSets(exercise);
      const activeRowIndex = computeActiveRow(exercise, rowCount);
      const existing = exercise.sets[rowIndex];

      let weight = draftWeight;
      let reps = draftReps;

      if (existing && rowIndex !== activeRowIndex) {
        weight = existing.weight;
        reps = existing.reps;
      }

      if (existing && reps <= 0) {
        weight = existing.weight;
        reps = existing.reps;
      }

      if (!existing && reps <= 0) {
        return;
      }

      if (existing) {
        const willComplete = !existing.completed;
        const result = await patchSetLog(existing.id, {
          weight,
          reps,
          completed: willComplete,
        });

        if (willComplete) {
          startRestTimer(restDurationSec);
          if (rowIndex === activeRowIndex) {
            setDraftsByExercise((current) => ({
              ...current,
              [exercise.id]: {
                weight: String(result.suggestion.next_weight_kg),
                reps: String(result.suggestion.next_reps),
              },
            }));
          }
        }

        return;
      }

      const setType = getSetType(exercise, rowIndex);
      const result = await logSetForActiveWorkout({
        workout_exercise_id: exercise.id,
        weight,
        reps,
        rpe: 8,
        duration: 60,
        completed: true,
        set_type: setType,
      });

      startRestTimer(restDurationSec);
      setDraftsByExercise((current) => ({
        ...current,
        [exercise.id]: {
          weight: String(result.suggestion.next_weight_kg),
          reps: String(result.suggestion.next_reps),
        },
      }));

      setRowCountByExercise((current) => ({
        ...current,
        [exercise.id]: Math.max(current[exercise.id] ?? 1, exercise.sets.length + 1),
      }));
    },
    [
      draftsByExercise,
      getPlannedSets,
      getSetType,
      logSetForActiveWorkout,
      patchSetLog,
      restDurationSec,
      rowCountByExercise,
      startRestTimer,
    ]
  );

  const openExerciseLibrary = useCallback(() => {
    (navigation as any).navigate('ExerciseLibrary');
  }, [navigation]);

  const finishWorkout = useCallback(async () => {
    const active = currentWorkout;
    if (!active) {
      return;
    }

    try {
      const result = await finishActiveWorkout();
      (navigation as any).navigate('WorkoutSummary', {
        summary: result.summary,
        nextPlan: result.nextPlan,
      });
      return;
    } catch {
      // Fall back to local completion for uninterrupted user flow.
    }

    const completed = active.state.exercises.reduce(
      (sum, exercise) => sum + exercise.sets.filter((setItem) => setItem.completed).length,
      0
    );
    const total = active.state.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);

    completeActiveWorkoutLocal({
      date: new Date().toISOString(),
      exercises: active.state.exercises,
      performance: total > 0 ? completed / total : 0,
    });

    (navigation as any).navigate('MainTabs', { screen: 'Home' });
  }, [completeActiveWorkoutLocal, currentWorkout, finishActiveWorkout, navigation]);

  const onExitWorkout = useCallback(() => {
    resetActiveWorkout();
    (navigation as any).navigate('MainTabs', { screen: 'Home' });
  }, [navigation, resetActiveWorkout]);

  const onMinimize = useCallback(() => {
    minimizeWorkout();
    (navigation as any).navigate('MainTabs', { screen: 'Training' });
  }, [minimizeWorkout, navigation]);

  const applySetType = useCallback((type: SetType) => {
    if (!setTypePicker) {
      return;
    }

    setSetTypesByExercise((current) => ({
      ...current,
      [setTypePicker.exerciseId]: {
        ...(current[setTypePicker.exerciseId] ?? {}),
        [setTypePicker.rowIndex]: type,
      },
    }));
    setSetTypePicker(null);
  }, [setTypePicker]);

  const applyRestPreset = useCallback(
    (seconds: number) => {
      setRestPickerOpen(false);
      startRestTimer(seconds);
      setCustomRestInput(String(seconds));
    },
    [startRestTimer]
  );

  const applyCustomRest = useCallback(() => {
    const parsed = Number.parseInt(customRestInput.trim(), 10);
    const next = Number.isFinite(parsed) && parsed > 0 ? parsed : restDurationSec;
    applyRestPreset(next);
  }, [applyRestPreset, customRestInput, restDurationSec]);

  const selectedExercise = selectedExerciseName
    ? exercises.find((exercise) => exercise.name === selectedExerciseName) ?? null
    : null;

  const selectedHistory = selectedExercise
    ? workoutHistory
        .slice()
        .reverse()
        .find((entry) => entry.exercises.some((exercise) => exercise.name === selectedExercise.name)) ?? null
    : null;

  const selectedHistoryExercise =
    selectedExercise && selectedHistory
      ? selectedHistory.exercises.find((exercise) => exercise.name === selectedExercise.name) ?? null
      : null;

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]} edges={[]}>
      <View style={[styles.container, { paddingHorizontal: horizontalGutter }]}> 
        <View style={styles.actionHeader}>
          <AppButton variant="secondary" style={styles.actionHeaderButton} onPress={onExitWorkout}>
            Back
          </AppButton>
          <Text style={styles.actionHeaderTitle}>Log Workout</Text>
          <AppButton style={styles.actionHeaderButton} onPress={finishWorkout}>
            Finish
          </AppButton>
        </View>

        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{currentWorkout?.plan.title ?? 'New Workout'}</Text>
            <Text style={styles.metaText}>{`${completedSets}/${Math.max(1, totalRows)} sets complete`}</Text>
          </View>

          <View style={styles.headerRight}>
            <Pressable
              onPress={() => setRestPickerOpen(true)}
              style={[styles.timerPill, restRunning ? styles.timerPillRunning : null]}
            >
              <Text style={styles.timerPillText}>{`⏱ ${formatDuration(restRunning ? restRemainingSec : restDurationSec)}`}</Text>
            </Pressable>
            <Text style={styles.elapsedText}>{timerState.isRunning ? 'Live' : 'Paused'}</Text>
          </View>
        </View>

        <View style={styles.mainTimerWrap}>
          <Text style={styles.mainTimerLabel}>Main Timer</Text>
          <Text style={styles.mainTimerValue}>{formatDuration(elapsedSeconds)}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>{formatDuration(elapsedSeconds)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Volume</Text>
            <Text style={styles.statValue}>{`${Math.round(totalVolume)}kg`}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Sets</Text>
            <Text style={styles.statValue}>{String(completedSets)}</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.max(2, Math.round(progress * 100))}%` }]} />
        </View>

        {aiCoachSettings.enabled && latestSetSuggestion ? (
          <AppCard style={styles.aiCard}>
            <Text style={styles.aiTitle}>{coachTitle}</Text>
            <Text style={styles.aiBody}>{latestSetSuggestion.adjustments[0] ?? 'Keep form clean and stay consistent.'}</Text>
            <Text style={styles.aiMeta}>{`Next: ${latestSetSuggestion.next_weight_kg}kg x ${latestSetSuggestion.next_reps} reps`}</Text>
          </AppCard>
        ) : null}

        {error ? (
          <AppCard style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <AppButton variant="secondary" onPress={clearError}>
              Dismiss
            </AppButton>
          </AppCard>
        ) : null}

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {!exercises.length ? (
            <AppCard style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>New workout started</Text>
              <Text style={styles.emptyBody}>Add your first exercise to begin logging sets.</Text>
              <View style={{ marginTop: spacing.sm }}>
                <AppButton onPress={openExerciseLibrary}>Add Exercise</AppButton>
              </View>
            </AppCard>
          ) : null}

          {exercises.map((exercise) => {
            const draft = draftsByExercise[exercise.id] ?? { weight: '20', reps: '8' };
            const plannedExercise =
              currentWorkout?.plan?.exercises?.find((item) => item.name.toLowerCase() === exercise.name.toLowerCase()) ?? null;
            const rowCount = rowCountByExercise[exercise.id] ?? getPlannedSets(exercise);

            return (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                planExercise={plannedExercise}
                rowCount={rowCount}
                draft={draft}
                getSetType={(rowIndex) => getSetType(exercise, rowIndex)}
                onOpenExercise={() => setSelectedExerciseName(exercise.name)}
                onChangeDraft={(field, value) => setDraftValue(exercise.id, field, value)}
                onPressSetType={(rowIndex) => setSetTypePicker({ exerciseId: exercise.id, rowIndex })}
                onToggleSet={(rowIndex) => toggleOrAddSet(exercise, rowIndex)}
                onAddSetRow={() => addSetRow(exercise)}
                onAddExerciseBelow={openExerciseLibrary}
              />
            );
          })}
        </ScrollView>

        <StickyActionBar>
          <View style={styles.footerActions}>
            <AppButton variant="secondary" style={styles.footerButton} onPress={openExerciseLibrary}>
              Add Exercise
            </AppButton>
            <AppButton variant="secondary" style={styles.footerButton} onPress={onMinimize}>
              Minimize
            </AppButton>
          </View>
        </StickyActionBar>
      </View>

      <Modal visible={Boolean(selectedExerciseName)} transparent animationType="slide" onRequestClose={() => setSelectedExerciseName(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedExerciseName}</Text>
              <AppButton variant="secondary" style={styles.smallCloseButton} onPress={() => setSelectedExerciseName(null)}>
                Close
              </AppButton>
            </View>

            <Text style={styles.previewMetaText}>Muscles</Text>
            <Text style={styles.cardBody}>{selectedExercise?.muscle_group ?? '—'}</Text>

            <Text style={[styles.previewMetaText, { marginTop: spacing.sm }]}>Equipment</Text>
            <Text style={styles.cardBody}>{selectedExercise?.equipment ?? '—'}</Text>

            <Text style={[styles.previewMetaText, { marginTop: spacing.sm }]}>Instructions</Text>
            <Text style={styles.cardBody}>
              {currentWorkout?.plan?.exercises?.find((exercise) => exercise.name === selectedExerciseName)?.coachCue ??
                'No instruction available.'}
            </Text>

            <Text style={[styles.previewMetaText, { marginTop: spacing.sm }]}>History</Text>
            {selectedHistoryExercise && selectedHistory ? (
              <Text style={styles.cardBody}>{`${selectedHistoryExercise.sets} sets • ${selectedHistoryExercise.topWeight ?? '-'}kg x ${selectedHistoryExercise.topReps ?? '-'} reps on ${new Date(selectedHistory.completedAt).toDateString()}`}</Text>
            ) : (
              <Text style={styles.cardBody}>No recent history for this exercise.</Text>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(setTypePicker)} transparent animationType="slide" onRequestClose={() => setSetTypePicker(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Set Type</Text>
            {SET_TYPE_OPTIONS.map((option) => (
              <AppButton key={option.value} variant="secondary" style={{ marginTop: spacing.xs }} onPress={() => applySetType(option.value)}>
                {option.label}
              </AppButton>
            ))}
            <AppButton variant="ghost" style={{ marginTop: spacing.sm }} onPress={() => setSetTypePicker(null)}>
              Cancel
            </AppButton>
          </View>
        </View>
      </Modal>

      <Modal visible={restPickerOpen} transparent animationType="slide" onRequestClose={() => setRestPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Rest Timer</Text>
            <View style={{ gap: spacing.xs }}>
              <AppButton variant="secondary" onPress={() => applyRestPreset(30)}>
                30 seconds
              </AppButton>
              <AppButton variant="secondary" onPress={() => applyRestPreset(60)}>
                60 seconds
              </AppButton>
              <AppButton variant="secondary" onPress={() => applyRestPreset(90)}>
                90 seconds
              </AppButton>
            </View>

            <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
              <Text style={styles.previewMetaText}>Custom seconds</Text>
              <AppInput value={customRestInput} onChangeText={setCustomRestInput} keyboardType="number-pad" />
              <AppButton variant="secondary" onPress={applyCustomRest}>
                Start Custom
              </AppButton>
              <AppButton
                variant="ghost"
                onPress={() => {
                  setRestRunning(false);
                  setRestPickerOpen(false);
                }}
              >
                Stop Timer
              </AppButton>
            </View>
          </View>
        </View>
      </Modal>
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
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  actionHeaderButton: {
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
  },
  actionHeaderTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '700',
  },
  metaText: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  elapsedText: {
    color: colors.mutedText,
    fontSize: typography.tiny,
    fontWeight: '700',
  },
  timerPill: {
    minWidth: 96,
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  timerPillRunning: {
    borderColor: 'rgba(34,197,94,0.7)',
    backgroundColor: 'rgba(34,197,94,0.15)',
  },
  timerPillText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: typography.caption,
  },
  mainTimerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  mainTimerLabel: {
    color: colors.mutedText,
    fontSize: typography.tiny,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mainTimerValue: {
    color: colors.text,
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    gap: 2,
  },
  statLabel: {
    color: colors.mutedText,
    fontSize: typography.tiny,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statValue: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22C55E',
  },
  content: {
    gap: spacing.sm,
    paddingBottom: 150,
  },
  emptyCard: {
    padding: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  emptyBody: {
    color: colors.mutedText,
    fontSize: typography.body,
    marginTop: spacing.xs,
  },
  errorCard: {
    marginBottom: spacing.sm,
    borderColor: '#5D2632',
  },
  errorText: {
    color: colors.text,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  aiCard: {
    marginBottom: spacing.sm,
    borderColor: 'rgba(52,199,89,0.4)',
    backgroundColor: 'rgba(52,199,89,0.1)',
  },
  aiTitle: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  aiBody: {
    color: colors.text,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  aiMeta: {
    color: colors.mutedText,
    fontSize: typography.tiny,
    fontWeight: '700',
  },
  footerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  footerButton: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#000000A6',
  },
  modalSheet: {
    maxHeight: '82%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  modalTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  smallCloseButton: {
    minHeight: 36,
    paddingHorizontal: 10,
    alignSelf: 'flex-end',
    borderRadius: 10,
  },
  previewMetaText: {
    color: colors.mutedText,
    fontSize: typography.tiny,
  },
  cardBody: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 20,
  },
});
