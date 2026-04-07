import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Modal, ScrollView, StyleSheet, Text, View, Vibration } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { AppButton, AppCard, AppInput, StickyActionBar } from '../../shared/components/ui';
import { useDeviceReader } from '../../shared/device/useDeviceReader';
import { useWorkoutFlow } from '../../shared/state/WorkoutFlowContext';
import type { SetType, WorkoutExerciseState } from '../../shared/api/workoutApi';
import { colors, radius, spacing, typography } from '../../shared/theme/tokens';
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
    settings,
    error,
    clearError,
    startEmptyWorkout,
    finishActiveWorkout,
    completeActiveWorkoutLocal,
    logSetForActiveWorkout,
    patchSetLog,
    minimizeWorkout,
    workoutHistory,
    setWorkoutScreenVisible,
  } = useWorkoutFlow();

  const [draftsByExercise, setDraftsByExercise] = useState<Record<string, DraftSet>>({});
  const [rowCountByExercise, setRowCountByExercise] = useState<Record<string, number>>({});
  const [setTypesByExercise, setSetTypesByExercise] = useState<Record<string, Record<number, SetType>>>({});

  const [selectedExerciseName, setSelectedExerciseName] = useState<string | null>(null);
  const [setTypePicker, setSetTypePicker] = useState<{ exerciseId: string; rowIndex: number } | null>(null);

  const [restDurationSec, setRestDurationSec] = useState<number>(Math.max(30, settings.workout.rest_timer_sec || 60));
  const [restRemainingSec, setRestRemainingSec] = useState<number>(Math.max(30, settings.workout.rest_timer_sec || 60));
  const [restRunning, setRestRunning] = useState(false);
  const [restPickerOpen, setRestPickerOpen] = useState(false);
  const [customRestInput, setCustomRestInput] = useState(String(Math.max(30, settings.workout.rest_timer_sec || 60)));

  useFocusEffect(
    useCallback(() => {
      setWorkoutScreenVisible(true);
      return () => {
        setWorkoutScreenVisible(false);
      };
    }, [setWorkoutScreenVisible])
  );

  useEffect(() => {
    if (!currentWorkout) {
      startEmptyWorkout();
    }
  }, [currentWorkout, startEmptyWorkout]);

  useEffect(() => {
    if (!restRunning) {
      return;
    }

    if (restRemainingSec <= 0) {
      setRestRunning(false);
      Vibration.vibrate(14);
      return;
    }

    const timer = setTimeout(() => {
      setRestRemainingSec((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [restRemainingSec, restRunning]);

  useEffect(() => {
    if (!currentWorkout) {
      return;
    }

    setRestDurationSec(Math.max(30, settings.workout.rest_timer_sec || 60));
    setRestRemainingSec(Math.max(30, settings.workout.rest_timer_sec || 60));
  }, [currentWorkout?.session.id, settings.workout.rest_timer_sec]);

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
    const safeSeconds = Math.max(15, seconds);
    setRestDurationSec(safeSeconds);
    setRestRemainingSec(safeSeconds);
    setCustomRestInput(String(safeSeconds));
    setRestRunning(true);
  }, []);

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
    Vibration.vibrate(8);
    navigation.navigate('ExerciseLibrary');
  }, [navigation]);

  const finishWorkout = useCallback(async () => {
    const active = currentWorkout;
    if (!active) {
      return;
    }

    Vibration.vibrate(12);
    try {
      const result = await finishActiveWorkout();
      navigation.navigate('WorkoutSummary', {
        summary: result.summary,
        nextPlan: result.nextPlan,
      });
      return;
    } catch {
      // Keep the user flow uninterrupted and save a local summary fallback.
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

    navigation.navigate('MainTabs', { screen: 'Home' });
  }, [completeActiveWorkoutLocal, currentWorkout, finishActiveWorkout, navigation]);

  const onBack = useCallback(() => {
    Vibration.vibrate(8);
    minimizeWorkout();
    navigation.navigate('MainTabs', { screen: 'Home' });
  }, [minimizeWorkout, navigation]);

  const applySetType = useCallback(
    (type: SetType) => {
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
    },
    [setTypePicker]
  );

  const applyRestPreset = useCallback(
    (seconds: number) => {
      startRestTimer(seconds);
      setRestPickerOpen(false);
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

  const workoutTitle = currentWorkout?.plan.title ?? 'Workout';

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]} edges={[]}>
      <View style={[styles.container, { paddingHorizontal: horizontalGutter }]}> 
        <View style={styles.topBar}>
          <AppButton variant="secondary" style={styles.topBarButton} onPress={onBack}>
            Back
          </AppButton>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {workoutTitle}
          </Text>
          <AppButton style={styles.topBarButton} onPress={finishWorkout}>
            Finish
          </AppButton>
        </View>

        <View style={styles.mainTimerWrap}>
          <Text style={styles.mainTimerLabel}>Workout Timer</Text>
          <Text style={styles.mainTimerValue}>{formatDuration(elapsedSeconds)}</Text>
          <Text style={styles.mainTimerState}>{timerState.isRunning ? 'Live' : 'Paused'}</Text>
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
            <Text style={styles.statValue}>{`${completedSets}/${Math.max(1, totalRows)}`}</Text>
          </View>
        </View>

        <AppCard style={styles.restCard}>
          <View style={styles.restHeader}>
            <Text style={styles.restTitle}>Rest Timer</Text>
            <AppButton variant="secondary" style={styles.restActionButton} onPress={() => setRestPickerOpen(true)}>
              Configure
            </AppButton>
          </View>
          <Text style={styles.restCountdown}>{formatDuration(restRunning ? restRemainingSec : restDurationSec)}</Text>
          <Text style={styles.restMeta}>{restRunning ? 'Running' : 'Ready'}</Text>
        </AppCard>

        {aiCoachSettings.enabled && latestSetSuggestion ? (
          <AppCard style={styles.aiCard}>
            <Text style={styles.aiTitle}>{coachTitle}</Text>
            <Text style={styles.aiBody} numberOfLines={2}>
              {latestSetSuggestion.adjustments[0] ?? 'Keep your form clean and move with control.'}
            </Text>
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
              <Text style={styles.emptyTitle}>Workout is ready</Text>
              <Text style={styles.emptyBody}>Add your first exercise to start logging sets.</Text>
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
              />
            );
          })}
        </ScrollView>

        <StickyActionBar>
          <AppButton style={styles.primaryFooterButton} onPress={openExerciseLibrary}>
            Add Exercise
          </AppButton>
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

            <Text style={styles.previewMetaText}>Muscle Group</Text>
            <Text style={styles.cardBody}>{selectedExercise?.muscle_group ?? '-'}</Text>

            <Text style={[styles.previewMetaText, { marginTop: spacing.xs }]}>Equipment</Text>
            <Text style={styles.cardBody}>{selectedExercise?.equipment ?? '-'}</Text>

            <Text style={[styles.previewMetaText, { marginTop: spacing.xs }]}>Instructions</Text>
            <Text style={styles.cardBody}>
              {currentWorkout?.plan?.exercises?.find((exercise) => exercise.name === selectedExerciseName)?.coachCue ??
                'No instruction available.'}
            </Text>

            <Text style={[styles.previewMetaText, { marginTop: spacing.xs }]}>History</Text>
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
            <Text style={styles.restSheetCountdown}>{formatDuration(restRunning ? restRemainingSec : restDurationSec)}</Text>

            <View style={styles.presetRow}>
              <AppButton variant="secondary" style={styles.presetButton} onPress={() => applyRestPreset(30)}>
                30s
              </AppButton>
              <AppButton variant="secondary" style={styles.presetButton} onPress={() => applyRestPreset(60)}>
                60s
              </AppButton>
              <AppButton variant="secondary" style={styles.presetButton} onPress={() => applyRestPreset(90)}>
                90s
              </AppButton>
            </View>

            <Text style={styles.previewMetaText}>Custom seconds</Text>
            <AppInput value={customRestInput} onChangeText={setCustomRestInput} keyboardType="number-pad" />
            <AppButton onPress={applyCustomRest}>Start</AppButton>

            {restRunning ? (
              <View style={styles.restActionsRow}>
                <AppButton
                  variant="secondary"
                  style={styles.restActionHalf}
                  onPress={() => setRestRunning((current) => !current)}
                >
                  {restRunning ? 'Pause' : 'Resume'}
                </AppButton>
                <AppButton
                  variant="ghost"
                  style={styles.restActionHalf}
                  onPress={() => {
                    setRestRunning(false);
                    setRestRemainingSec(restDurationSec);
                  }}
                >
                  Stop
                </AppButton>
              </View>
            ) : null}

            <AppButton variant="ghost" onPress={() => setRestPickerOpen(false)}>
              Close
            </AppButton>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  topBarButton: {
    minHeight: 42,
    minWidth: 88,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
  },
  topBarTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  mainTimerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.md,
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
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: -1,
  },
  mainTimerState: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
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
    fontWeight: '800',
  },
  restCard: {
    marginBottom: spacing.md,
  },
  restHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  restTitle: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  restActionButton: {
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  restCountdown: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  restMeta: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  aiCard: {
    marginBottom: spacing.md,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  aiTitle: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  aiBody: {
    color: colors.mutedText,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  errorCard: {
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.text,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  content: {
    gap: spacing.md,
    paddingBottom: 140,
  },
  emptyCard: {
    padding: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
  },
  emptyBody: {
    color: colors.mutedText,
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
  primaryFooterButton: {
    minHeight: 54,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#000000CC',
  },
  modalSheet: {
    maxHeight: '86%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
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
    fontWeight: '800',
  },
  smallCloseButton: {
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  previewMetaText: {
    color: colors.mutedText,
    fontSize: typography.tiny,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardBody: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
  },
  restSheetCountdown: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  presetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  presetButton: {
    flex: 1,
    minHeight: 48,
  },
  restActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  restActionHalf: {
    flex: 1,
    minHeight: 48,
  },
});
