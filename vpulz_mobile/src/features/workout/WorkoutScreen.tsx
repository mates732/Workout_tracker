import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

type ExerciseLibraryItem = {
  id?: number;
  name: string;
};

const FALLBACK_EXERCISES: ExerciseLibraryItem[] = [
  { id: -1, name: 'Bench Press' },
  { id: -2, name: 'Incline DB Press' },
  { id: -3, name: 'Squat' },
  { id: -4, name: 'Deadlift' },
  { id: -5, name: 'Pull Up' },
];

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

export function WorkoutScreen() {
  const navigation = useNavigation<WorkoutNavigationProp>();
  const insets = useSafeAreaInsets();
  const { horizontalGutter } = useDeviceReader();
  const {
    currentWorkout,
    elapsedSeconds,
    error,
    clearError,
    startEmptyWorkout,
    completeActiveWorkoutLocal,
    addExerciseToActiveWorkout,
    logSetForActiveWorkout,
    patchSetLog,
    searchExerciseLibrary,
    minimizeWorkout,
    workoutHistory,
  } = useWorkoutFlow();

  const [draftsByExercise, setDraftsByExercise] = useState<Record<string, DraftSet>>({});
  const [rowCountByExercise, setRowCountByExercise] = useState<Record<string, number>>({});
  const [setTypesByExercise, setSetTypesByExercise] = useState<Record<string, Record<number, SetType>>>({});

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [libraryResults, setLibraryResults] = useState<ExerciseLibraryItem[]>([]);
  const [remoteFailed, setRemoteFailed] = useState(false);

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
      const weight = parsePositiveFloat(draft.weight);
      const reps = parsePositiveInt(draft.reps);
      if (reps <= 0) {
        return;
      }

      const existing = exercise.sets[rowIndex];
      if (existing) {
        const willComplete = !existing.completed;
        const result = await patchSetLog(existing.id, {
          weight,
          reps,
          completed: willComplete,
        });

        if (willComplete) {
          startRestTimer(restDurationSec);
          setDraftsByExercise((current) => ({
            ...current,
            [exercise.id]: {
              weight: String(result.suggestion.next_weight_kg),
              reps: String(result.suggestion.next_reps),
            },
          }));
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
    [draftsByExercise, getSetType, logSetForActiveWorkout, patchSetLog, restDurationSec, startRestTimer]
  );

  const openExerciseLibrary = useCallback(() => {
    setLibraryOpen(true);
  }, []);

  useEffect(() => {
    if (!libraryOpen) {
      return;
    }

    let cancelled = false;
    const handle = setTimeout(() => {
      void searchExerciseLibrary(exerciseQuery, undefined)
        .then((results) => {
          if (cancelled) {
            return;
          }
          setLibraryResults(
            results.map((item) => ({
              id: item.id,
              name: item.name,
            }))
          );
          setRemoteFailed(false);
        })
        .catch(() => {
          if (cancelled) {
            return;
          }
          setLibraryResults([]);
          setRemoteFailed(true);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [exerciseQuery, libraryOpen, searchExerciseLibrary]);

  const addExerciseAndClose = useCallback(
    (exercise: ExerciseLibraryItem) => {
      setLibraryOpen(false);
      setExerciseQuery('');
      setLibraryResults([]);
      setRemoteFailed(false);
      void addExerciseToActiveWorkout({ exercise_id: exercise.id, exercise_name: exercise.name }).catch(() => undefined);
    },
    [addExerciseToActiveWorkout]
  );

  const finishWorkout = useCallback(() => {
    const active = currentWorkout;
    if (!active) {
      return;
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
  }, [completeActiveWorkoutLocal, currentWorkout, navigation]);

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
            <Text style={styles.elapsedText}>{formatDuration(elapsedSeconds)}</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.max(2, Math.round(progress * 100))}%` }]} />
        </View>

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
            <AppButton style={styles.finishButton} onPress={finishWorkout}>
              Finish
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

      <Modal visible={libraryOpen} animationType="slide" transparent onRequestClose={() => setLibraryOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Add Exercise</Text>
            <AppInput
              value={exerciseQuery}
              onChangeText={setExerciseQuery}
              placeholder="Search exercises"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {remoteFailed ? <Text style={styles.modalMeta}>Could not load from WGER. Showing fallback list.</Text> : null}
            <FlatList
              data={libraryResults.length ? libraryResults : FALLBACK_EXERCISES}
              keyExtractor={(item) => String(item.id ?? item.name)}
              keyboardShouldPersistTaps="handled"
              style={styles.libraryList}
              renderItem={({ item }) => (
                <AppCard style={styles.libraryCard}>
                  <View style={styles.libraryRow}>
                    <View style={styles.exerciseCopy}>
                      <Text style={styles.exerciseTitle}>{item.name}</Text>
                    </View>
                    <AppButton variant="secondary" onPress={() => addExerciseAndClose(item)}>
                      Add
                    </AppButton>
                  </View>
                </AppCard>
              )}
            />
            <View style={styles.footerActionsPlain}>
              <AppButton variant="secondary" style={styles.footerButton} onPress={() => setLibraryOpen(false)}>
                Done
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
  footerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  footerActionsPlain: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  footerButton: {
    flex: 1,
  },
  finishButton: {
    flex: 1.2,
    minHeight: 48,
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
  modalMeta: {
    color: colors.mutedText,
    fontSize: typography.caption,
    lineHeight: 18,
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
  libraryList: {
    maxHeight: 320,
  },
  libraryCard: {
    padding: spacing.sm,
  },
  libraryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  exerciseCopy: {
    flex: 1,
    gap: 2,
  },
  exerciseTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
});
