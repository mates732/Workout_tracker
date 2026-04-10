import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, Vibration } from 'react-native';
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
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}k`;
  return String(Math.round(kg));
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
    if (!restRunning) return;
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
    if (!currentWorkout) return;
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
    () => exercises.reduce((sum, ex) => sum + (rowCountByExercise[ex.id] ?? getPlannedSets(ex)), 0),
    [exercises, getPlannedSets, rowCountByExercise]
  );

  const completedSets = useMemo(
    () => exercises.reduce((sum, ex) => sum + ex.sets.filter((s) => s.completed).length, 0),
    [exercises]
  );

  const totalVolume = useMemo(
    () =>
      exercises.reduce(
        (sum, ex) =>
          sum +
          ex.sets
            .filter((s) => s.completed)
            .reduce((setSum, s) => setSum + s.weight * s.reps, 0),
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
    const safe = Math.max(15, seconds);
    setRestDurationSec(safe);
    setRestRemainingSec(safe);
    setCustomRestInput(String(safe));
    setRestRunning(true);
  }, []);

  useEffect(() => {
    setDraftsByExercise((current) => {
      const next = { ...current };
      let changed = false;
      exercises.forEach((exercise) => {
        if (next[exercise.id]) return;
        const lastSet = exercise.sets[exercise.sets.length - 1];
        next[exercise.id] = { weight: String(lastSet?.weight ?? 20), reps: String(lastSet?.reps ?? 8) };
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
      Object.keys(next).forEach((id) => {
        if (!exercises.some((ex) => ex.id === id)) { delete next[id]; changed = true; }
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
    (exercise: WorkoutExerciseState, rowIndex: number): SetType =>
      setTypesByExercise[exercise.id]?.[rowIndex] ?? exercise.sets[rowIndex]?.set_type ?? 'normal',
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
        [exercise.id]: { weight: String(lastSet.weight), reps: String(lastSet.reps) },
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

      if (existing && rowIndex !== activeRowIndex) { weight = existing.weight; reps = existing.reps; }
      if (existing && reps <= 0) { weight = existing.weight; reps = existing.reps; }
      if (!existing && reps <= 0) return;

      if (existing) {
        const willComplete = !existing.completed;
        const result = await patchSetLog(existing.id, { weight, reps, completed: willComplete });
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
    if (!active) return;
    Vibration.vibrate(12);
    try {
      const result = await finishActiveWorkout();
      navigation.navigate('WorkoutSummary', { summary: result.summary, nextPlan: result.nextPlan });
      return;
    } catch {
      // fall through to local completion
    }
    const completed = active.state.exercises.reduce(
      (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
      0
    );
    const total = active.state.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
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
      if (!setTypePicker) return;
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
    (seconds: number) => { startRestTimer(seconds); setRestPickerOpen(false); },
    [startRestTimer]
  );

  const applyCustomRest = useCallback(() => {
    const parsed = Number.parseInt(customRestInput.trim(), 10);
    const next = Number.isFinite(parsed) && parsed > 0 ? parsed : restDurationSec;
    applyRestPreset(next);
  }, [applyRestPreset, customRestInput, restDurationSec]);

  const selectedExercise = selectedExerciseName
    ? exercises.find((ex) => ex.name === selectedExerciseName) ?? null
    : null;

  const selectedHistory = selectedExercise
    ? workoutHistory
        .slice()
        .reverse()
        .find((entry) => entry.exercises.some((ex) => ex.name === selectedExercise.name)) ?? null
    : null;

  const selectedHistoryExercise =
    selectedExercise && selectedHistory
      ? selectedHistory.exercises.find((ex) => ex.name === selectedExercise.name) ?? null
      : null;

  const workoutTitle = currentWorkout?.plan.title ?? 'Workout';
  const restPct = restDurationSec > 0 ? restRemainingSec / restDurationSec : 0;

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]} edges={[]}>
      <View style={[styles.container, { paddingHorizontal: horizontalGutter }]}>

        {/* ── Top bar ──────────────────────────────────────── */}
        <View style={styles.topBar}>
          <Pressable style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>‹ Back</Text>
          </Pressable>
          <View style={styles.topBarCenter}>
            <Text style={styles.topBarTitle} numberOfLines={1}>{workoutTitle}</Text>
            <View style={styles.liveChip}>
              <View style={[styles.liveDot, { backgroundColor: timerState.isRunning ? colors.success : colors.mutedText }]} />
              <Text style={styles.liveChipText}>{timerState.isRunning ? 'LIVE' : 'PAUSED'}</Text>
            </View>
          </View>
          <Pressable style={styles.finishBtn} onPress={finishWorkout}>
            <Text style={styles.finishBtnText}>Finish</Text>
          </Pressable>
        </View>

        {/* ── Live stats bar ───────────────────────────────── */}
        <View style={styles.statsBar}>
          <View style={styles.statsBarCell}>
            <Text style={styles.statsBarValue}>{formatDuration(elapsedSeconds)}</Text>
            <Text style={styles.statsBarLabel}>TIME</Text>
          </View>
          <View style={styles.statsBarDivider} />
          <View style={styles.statsBarCell}>
            <Text style={styles.statsBarValue}>{formatVolume(totalVolume)}</Text>
            <Text style={styles.statsBarLabel}>KG</Text>
          </View>
          <View style={styles.statsBarDivider} />
          <View style={styles.statsBarCell}>
            <Text style={styles.statsBarValue}>{`${completedSets}/${Math.max(1, totalRows)}`}</Text>
            <Text style={styles.statsBarLabel}>SETS</Text>
          </View>
        </View>

        {/* ── Rest timer banner (only when running) ────────── */}
        {restRunning && (
          <Pressable style={styles.restBanner} onPress={() => setRestPickerOpen(true)}>
            <View style={styles.restBannerLeft}>
              <View style={styles.restBannerDot} />
              <Text style={styles.restBannerLabel}>Rest</Text>
            </View>
            <View style={styles.restProgressTrack}>
              <View style={[styles.restProgressFill, { width: `${Math.round(restPct * 100)}%` }]} />
            </View>
            <Text style={styles.restBannerTime}>{formatDuration(restRemainingSec)}</Text>
          </Pressable>
        )}

        {/* ── Rest config shortcut (when idle) ─────────────── */}
        {!restRunning && (
          <Pressable style={styles.restIdleRow} onPress={() => setRestPickerOpen(true)}>
            <Text style={styles.restIdleLabel}>Rest timer · {formatDuration(restDurationSec)}</Text>
            <Text style={styles.restIdleEdit}>Edit</Text>
          </Pressable>
        )}

        {/* ── AI Coach tip ─────────────────────────────────── */}
        {aiCoachSettings.enabled && latestSetSuggestion && (
          <View style={styles.coachBanner}>
            <Text style={styles.coachTitle}>{coachTitle}</Text>
            <Text style={styles.coachBody} numberOfLines={2}>
              {latestSetSuggestion.adjustments[0] ?? 'Keep your form clean and move with control.'}
            </Text>
          </View>
        )}

        {/* ── Error ────────────────────────────────────────── */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={clearError}><Text style={styles.errorDismiss}>✕</Text></Pressable>
          </View>
        )}

        {/* ── Exercise list ─────────────────────────────────── */}
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!exercises.length && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No exercises yet</Text>
              <Text style={styles.emptyBody}>Tap "Add Exercise" below to build your workout.</Text>
            </View>
          )}

          {exercises.map((exercise) => {
            const draft = draftsByExercise[exercise.id] ?? { weight: '20', reps: '8' };
            const plannedExercise =
              currentWorkout?.plan?.exercises?.find(
                (item) => item.name.toLowerCase() === exercise.name.toLowerCase()
              ) ?? null;
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

        {/* ── Footer ───────────────────────────────────────── */}
        <StickyActionBar>
          <AppButton style={styles.addExerciseBtn} onPress={openExerciseLibrary}>
            + Add Exercise
          </AppButton>
        </StickyActionBar>
      </View>

      {/* ── Exercise detail modal ─────────────────────────── */}
      <Modal
        visible={Boolean(selectedExerciseName)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedExerciseName(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedExerciseName}</Text>
              <Pressable style={styles.modalClose} onPress={() => setSelectedExerciseName(null)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.modalDetailRow}>
              <Text style={styles.modalDetailLabel}>Muscle Group</Text>
              <Text style={styles.modalDetailValue}>{selectedExercise?.muscle_group ?? '—'}</Text>
            </View>
            <View style={styles.modalDetailRow}>
              <Text style={styles.modalDetailLabel}>Equipment</Text>
              <Text style={styles.modalDetailValue}>{selectedExercise?.equipment ?? '—'}</Text>
            </View>
            <View style={styles.modalDetailRow}>
              <Text style={styles.modalDetailLabel}>Coach Cue</Text>
              <Text style={styles.modalDetailValue}>
                {currentWorkout?.plan?.exercises?.find((ex) => ex.name === selectedExerciseName)?.coachCue ??
                  'No instruction available.'}
              </Text>
            </View>
            <View style={styles.modalDetailRow}>
              <Text style={styles.modalDetailLabel}>History</Text>
              <Text style={styles.modalDetailValue}>
                {selectedHistoryExercise && selectedHistory
                  ? `${selectedHistoryExercise.sets} sets · ${selectedHistoryExercise.topWeight ?? '—'}kg × ${selectedHistoryExercise.topReps ?? '—'} reps · ${new Date(selectedHistory.completedAt).toLocaleDateString()}`
                  : 'No recent history.'}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Set type picker ───────────────────────────────── */}
      <Modal
        visible={Boolean(setTypePicker)}
        transparent
        animationType="slide"
        onRequestClose={() => setSetTypePicker(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Set Type</Text>
            {SET_TYPE_OPTIONS.map((option) => (
              <AppButton
                key={option.value}
                variant="secondary"
                style={styles.setTypeOption}
                onPress={() => applySetType(option.value)}
              >
                {option.label}
              </AppButton>
            ))}
            <AppButton variant="ghost" style={styles.setTypeOption} onPress={() => setSetTypePicker(null)}>
              Cancel
            </AppButton>
          </View>
        </View>
      </Modal>

      {/* ── Rest timer modal ──────────────────────────────── */}
      <Modal
        visible={restPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setRestPickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.restModalHeader}>
              <Text style={styles.modalTitle}>Rest Timer</Text>
              {restRunning && (
                <Text style={styles.restModalCountdown}>{formatDuration(restRemainingSec)}</Text>
              )}
            </View>

            <View style={styles.restPresetRow}>
              {[30, 60, 90, 120].map((s) => (
                <Pressable
                  key={s}
                  style={[styles.restPresetBtn, restDurationSec === s && styles.restPresetBtnActive]}
                  onPress={() => applyRestPreset(s)}
                >
                  <Text style={[styles.restPresetText, restDurationSec === s && styles.restPresetTextActive]}>
                    {s < 60 ? `${s}s` : `${s / 60}m`}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.restCustomRow}>
              <AppInput
                value={customRestInput}
                onChangeText={setCustomRestInput}
                keyboardType="number-pad"
                style={styles.restCustomInput}
              />
              <AppButton onPress={applyCustomRest} style={styles.restCustomStart}>
                Start
              </AppButton>
            </View>

            {restRunning && (
              <View style={styles.restControlRow}>
                <AppButton
                  variant="secondary"
                  style={styles.restControlBtn}
                  onPress={() => setRestRunning((r) => !r)}
                >
                  {restRunning ? 'Pause' : 'Resume'}
                </AppButton>
                <AppButton
                  variant="ghost"
                  style={styles.restControlBtn}
                  onPress={() => { setRestRunning(false); setRestRemainingSec(restDurationSec); }}
                >
                  Reset
                </AppButton>
              </View>
            )}

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

  // ── Top bar ──────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  backBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    minWidth: 72,
  },
  backBtnText: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '700',
  },
  topBarCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  topBarTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  liveChipText: {
    color: colors.mutedText,
    fontSize: typography.tiny,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  finishBtn: {
    minWidth: 72,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtnText: {
    color: '#000000',
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // ── Live stats bar ───────────────────────────────────────
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  statsBarCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statsBarValue: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statsBarLabel: {
    color: colors.mutedText,
    fontSize: typography.tiny,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  statsBarDivider: {
    width: 1,
    height: '70%',
    backgroundColor: colors.border,
    alignSelf: 'center',
  },

  // ── Rest banner (running) ────────────────────────────────
  restBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(52,199,89,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(52,199,89,0.30)',
    marginBottom: spacing.xs,
  },
  restBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  restBannerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  restBannerLabel: {
    color: colors.success,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  restProgressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(52,199,89,0.18)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  restProgressFill: {
    height: 4,
    backgroundColor: colors.success,
    borderRadius: 2,
  },
  restBannerTime: {
    color: colors.success,
    fontSize: typography.caption,
    fontWeight: '800',
    minWidth: 42,
    textAlign: 'right',
  },

  // ── Rest idle row ────────────────────────────────────────
  restIdleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.xs,
  },
  restIdleLabel: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  restIdleEdit: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
  },

  // ── AI coach banner ──────────────────────────────────────
  coachBanner: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary + '33',
    backgroundColor: colors.primary + '0D',
    gap: 3,
    marginBottom: spacing.xs,
  },
  coachTitle: {
    color: colors.primary,
    fontSize: typography.tiny,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  coachBody: {
    color: colors.secondaryText,
    fontSize: typography.caption,
    lineHeight: 18,
  },

  // ── Error banner ─────────────────────────────────────────
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger + '55',
    backgroundColor: colors.danger + '15',
    marginBottom: spacing.xs,
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  errorDismiss: {
    color: colors.danger,
    fontSize: typography.body,
    fontWeight: '700',
  },

  // ── Exercise list ────────────────────────────────────────
  content: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  emptyState: {
    paddingTop: 60,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
  },
  emptyBody: {
    color: colors.mutedText,
    fontSize: typography.caption,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },

  // ── Add exercise button ──────────────────────────────────
  addExerciseBtn: {
    minHeight: 54,
    borderRadius: radius.lg,
  },

  // ── Modals ───────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalSheet: {
    maxHeight: '86%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    backgroundColor: '#0F0F13',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '700',
  },
  modalDetailRow: {
    gap: 3,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalDetailLabel: {
    color: colors.mutedText,
    fontSize: typography.tiny,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  modalDetailValue: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
  },
  setTypeOption: {
    minHeight: 50,
  },

  // ── Rest modal ───────────────────────────────────────────
  restModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  restModalCountdown: {
    color: colors.success,
    fontSize: typography.subtitle,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  restPresetRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  restPresetBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restPresetBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '22',
  },
  restPresetText: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  restPresetTextActive: {
    color: colors.primary,
  },
  restCustomRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  restCustomInput: {
    flex: 1,
  },
  restCustomStart: {
    minWidth: 88,
  },
  restControlRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  restControlBtn: {
    flex: 1,
    minHeight: 48,
  },
});
