import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';
import type {
  ExerciseItem,
  LoggedSet,
  SetFeedback,
  SetSuggestion,
  WorkoutExerciseState,
  WorkoutState,
} from '../../shared/api/workoutApi';
import {
  AppButton,
  AppCard,
  AppChip,
  AppInput,
  StickyActionBar,
} from '../../shared/components/ui';
import { useWorkoutFlow } from '../../shared/state/WorkoutFlowContext';
import { colors, radius, spacing, typography } from '../../shared/theme/tokens';

type WorkoutNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type EditableField = 'weight' | 'reps';

type EditingCell = {
  exerciseId: string;
  setId: string;
  field: EditableField;
  value: string;
};

const EQUIPMENT_FILTERS = ['all', 'barbell', 'dumbbell', 'machine', 'cable', 'bodyweight'];
const BASE_MUSCLE_FILTERS = ['all', 'chest', 'back', 'legs', 'shoulders', 'arms', 'core'];

function parseFloatSafe(value: string): number {
  const parsed = Number.parseFloat(value.replace(',', '.').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseIntSafe(value: string): number {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sessionSummary(workout: WorkoutState): {
  durationMinutes: number;
  totalVolume: number;
  totalSets: number;
  personalRecord: string | null;
  insight: string | null;
} {
  const rows = workout.exercises.flatMap((exercise) =>
    exercise.sets
      .filter((setItem) => setItem.completed)
      .map((setItem) => ({ ...setItem, exerciseName: exercise.name }))
  );

  const totalVolume = rows.reduce((sum, row) => sum + row.weight * row.reps, 0);
  const totalSets = rows.length;

  const startMs = new Date(workout.start_time).getTime();
  const endMs = workout.end_time ? new Date(workout.end_time).getTime() : Date.now();
  const durationMinutes = Math.max(1, Math.round((endMs - startMs) / 60000));

  const strongest = [...rows].sort((a, b) => b.weight - a.weight || b.reps - a.reps)[0];
  const personalRecord = strongest
    ? `${strongest.exerciseName} ${strongest.weight} kg x ${strongest.reps}`
    : null;

  let insight = 'Add one more set to keep momentum.';
  if (totalSets >= 14) {
    insight = 'Big session output. You held volume really well.';
  } else if (totalSets >= 8) {
    insight = 'Strong pacing. This is quality work.';
  } else if (totalSets > 0) {
    insight = 'Short but effective session. Consistency wins.';
  }

  return {
    durationMinutes,
    totalVolume,
    totalSets,
    personalRecord,
    insight,
  };
}

function startedAt(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function toInitials(label: string): string {
  const chunks = label
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '');
  return chunks.join('') || 'EX';
}

function previousLabel(exercise: WorkoutExerciseState): string {
  const first = exercise.sets[0];
  if (!first) {
    return 'No previous data';
  }
  return `${first.weight}kg x ${first.reps}`;
}

export function WorkoutScreen() {
  const navigation = useNavigation<WorkoutNavigationProp>();
  const {
    connection,
    busy,
    error,
    clearError,
    activeWorkout,
    workoutState,
    startOrResumeWorkout,
    finishActiveWorkout,
    refreshWorkoutState,
    addExerciseToActiveWorkout,
    logSetForActiveWorkout,
    patchSetLog,
    searchExerciseLibrary,
  } = useWorkoutFlow();

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [libraryQuery, setLibraryQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryRows, setLibraryRows] = useState<ExerciseItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Record<number, boolean>>({});
  const [recentItems, setRecentItems] = useState<ExerciseItem[]>([]);
  const [hiddenSetIds, setHiddenSetIds] = useState<Record<string, boolean>>({});
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [feedbackByExerciseId, setFeedbackByExerciseId] = useState<Record<string, SetFeedback>>({});
  const [suggestionByExerciseId, setSuggestionByExerciseId] = useState<Record<string, SetSuggestion>>({});

  const [customName, setCustomName] = useState('');
  const [customMuscle, setCustomMuscle] = useState('');
  const [customEquipment, setCustomEquipment] = useState('');

  const commitLock = useRef(false);

  const orderedExercises = useMemo(
    () => [...(workoutState?.exercises ?? [])].sort((a, b) => a.ordering - b.ordering),
    [workoutState?.exercises]
  );

  const dynamicMuscles = useMemo(() => {
    const extras = libraryRows
      .map((item) => item.muscle_group.toLowerCase())
      .filter((item) => !BASE_MUSCLE_FILTERS.includes(item));
    return [...BASE_MUSCLE_FILTERS, ...extras];
  }, [libraryRows]);

  const filteredLibraryRows = useMemo(() => {
    let rows = [...libraryRows];

    if (selectedEquipment !== 'all') {
      rows = rows.filter((item) => item.equipment.toLowerCase().includes(selectedEquipment));
    }

    rows.sort((a, b) => {
      const aFav = favoriteIds[a.id] ? 1 : 0;
      const bFav = favoriteIds[b.id] ? 1 : 0;
      return bFav - aFav;
    });

    return rows;
  }, [favoriteIds, libraryRows, selectedEquipment]);

  useEffect(() => {
    if (!activeWorkout) {
      return;
    }
    void refreshWorkoutState().catch(() => undefined);
  }, [activeWorkout, refreshWorkoutState]);

  useEffect(() => {
    if (!libraryOpen) {
      return;
    }

    let mounted = true;
    const timer = setTimeout(async () => {
      setLibraryLoading(true);
      try {
        const found = await searchExerciseLibrary(
          libraryQuery || undefined,
          selectedMuscle === 'all' ? undefined : selectedMuscle
        );
        if (mounted) {
          setLibraryRows(found);
        }
      } finally {
        if (mounted) {
          setLibraryLoading(false);
        }
      }
    }, 220);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [libraryOpen, libraryQuery, searchExerciseLibrary, selectedMuscle]);

  const onStartWorkout = async () => {
    await startOrResumeWorkout();
    Vibration.vibrate(8);
  };

  const onFinishWorkout = async () => {
    if (!workoutState) {
      return;
    }

    const summary = sessionSummary(workoutState);
    await finishActiveWorkout();
    navigation.navigate('WorkoutSummary', summary);
  };

  const onToggleFavorite = (exerciseId: number) => {
    setFavoriteIds((current) => ({
      ...current,
      [exerciseId]: !current[exerciseId],
    }));
  };

  const onAddExercise = async (exercise: ExerciseItem) => {
    await addExerciseToActiveWorkout({ exercise_id: exercise.id });
    setRecentItems((current) => {
      const merged = [exercise, ...current.filter((item) => item.id !== exercise.id)];
      return merged.slice(0, 6);
    });
    setLibraryOpen(false);
    Vibration.vibrate(8);
  };

  const onCreateCustomExercise = async () => {
    const name = customName.trim();
    if (!name) {
      return;
    }

    await addExerciseToActiveWorkout({ exercise_name: name });
    setCustomName('');
    setCustomMuscle('');
    setCustomEquipment('');
    setCreateOpen(false);
    setLibraryOpen(false);
  };

  const onDeleteSet = (setId: string) => {
    setHiddenSetIds((current) => ({ ...current, [setId]: true }));
    Vibration.vibrate(6);
  };

  const onToggleSetDone = async (setId: string, completed: boolean) => {
    await patchSetLog(setId, { completed: !completed });
    Vibration.vibrate(8);
  };

  const onStartCellEdit = (
    exerciseId: string,
    setId: string,
    field: EditableField,
    current: number
  ) => {
    setEditingCell({
      exerciseId,
      setId,
      field,
      value: String(current),
    });
  };

  const onCommitCell = async (
    exercise: WorkoutExerciseState,
    setItem: LoggedSet,
    moveToNextField: boolean
  ) => {
    if (!editingCell || commitLock.current) {
      return;
    }

    if (editingCell.exerciseId !== exercise.id || editingCell.setId !== setItem.id) {
      return;
    }

    commitLock.current = true;
    try {
      const field = editingCell.field;
      if (field === 'weight') {
        const weight = parseFloatSafe(editingCell.value);
        if (weight <= 0) {
          setEditingCell(null);
          return;
        }
        await patchSetLog(setItem.id, { weight });

        if (moveToNextField) {
          setEditingCell({
            exerciseId: exercise.id,
            setId: setItem.id,
            field: 'reps',
            value: String(setItem.reps),
          });
          return;
        }
      }

      if (field === 'reps') {
        const reps = parseIntSafe(editingCell.value);
        if (reps <= 0) {
          setEditingCell(null);
          return;
        }
        await patchSetLog(setItem.id, { reps });
      }

      setEditingCell(null);
    } finally {
      commitLock.current = false;
    }
  };

  const onAddSet = async (exercise: WorkoutExerciseState) => {
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const suggested = suggestionByExerciseId[exercise.id];

    const response = await logSetForActiveWorkout({
      workout_exercise_id: exercise.id,
      weight: suggested?.next_weight_kg ?? lastSet?.weight ?? 20,
      reps: suggested?.next_reps ?? lastSet?.reps ?? 8,
      rpe: lastSet?.rpe ?? 8,
      duration: lastSet?.duration ?? 90,
      completed: true,
    });

    setFeedbackByExerciseId((current) => ({
      ...current,
      [exercise.id]: response.feedback,
    }));
    setSuggestionByExerciseId((current) => ({
      ...current,
      [exercise.id]: response.suggestion,
    }));
    Vibration.vibrate(10);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <View>
              <Text style={styles.pageTitle}>VPULZ Workout</Text>
              <Text style={styles.pageSubtitle}>Track faster with inline logging</Text>
            </View>
            <Text style={styles.connectionBadge}>{connection.userId}</Text>
          </View>

          {error ? (
            <Pressable style={styles.errorBanner} onPress={clearError}>
              <Text style={styles.errorText}>{error}</Text>
            </Pressable>
          ) : null}

          {!activeWorkout ? (
            <AppCard>
              <Text style={styles.cardTitle}>Ready to train?</Text>
              <Text style={styles.cardBody}>Start a new workout and log each set in two taps.</Text>
              <AppButton onPress={onStartWorkout}>{busy ? 'Starting...' : 'Start Workout'}</AppButton>
            </AppCard>
          ) : (
            <AppCard>
              <Text style={styles.cardTitle}>Session active</Text>
              <Text style={styles.cardBody}>Started {startedAt(activeWorkout.start_time)}</Text>
              <Text style={styles.cardBody}>{orderedExercises.length} exercises in this session</Text>
            </AppCard>
          )}

          {orderedExercises.map((exercise) => {
            const feedback = feedbackByExerciseId[exercise.id];
            const suggestion = suggestionByExerciseId[exercise.id];
            const visibleSets = exercise.sets.filter((setItem) => !hiddenSetIds[setItem.id]);

            return (
              <AppCard key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <View>
                    <Text style={styles.exerciseTitle}>{exercise.name}</Text>
                    <Text style={styles.exerciseSubtitle}>Prev: {previousLabel(exercise)}</Text>
                  </View>
                  <Text style={styles.exerciseTag}>{exercise.muscle_group}</Text>
                </View>

                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderText, styles.colSet]}>Set</Text>
                  <Text style={[styles.tableHeaderText, styles.colWeight]}>Weight</Text>
                  <Text style={[styles.tableHeaderText, styles.colReps]}>Reps</Text>
                  <Text style={[styles.tableHeaderText, styles.colDone]}>Done</Text>
                </View>

                {visibleSets.map((setItem, index) => {
                  const editWeight =
                    editingCell?.exerciseId === exercise.id &&
                    editingCell?.setId === setItem.id &&
                    editingCell.field === 'weight';
                  const editReps =
                    editingCell?.exerciseId === exercise.id &&
                    editingCell?.setId === setItem.id &&
                    editingCell.field === 'reps';

                  return (
                    <Swipeable
                      key={setItem.id}
                      overshootRight={false}
                      renderRightActions={() => (
                        <Pressable
                          style={styles.deleteAction}
                          onPress={() => onDeleteSet(setItem.id)}
                          accessibilityRole="button"
                          accessibilityLabel="Delete set"
                        >
                          <Text style={styles.deleteActionText}>Delete</Text>
                        </Pressable>
                      )}
                    >
                      <View style={[styles.tableRow, setItem.completed && styles.tableRowDone]}>
                        <Text style={[styles.tableCellText, styles.colSet]}>{index + 1}</Text>

                        <View style={styles.colWeight}>
                          {editWeight ? (
                            <TextInput
                              autoFocus
                              value={editingCell?.value ?? ''}
                              onChangeText={(value) =>
                                setEditingCell((current) => (current ? { ...current, value } : current))
                              }
                              onSubmitEditing={() => {
                                void onCommitCell(exercise, setItem, true);
                              }}
                              onBlur={() => {
                                if (
                                  editingCell?.exerciseId === exercise.id &&
                                  editingCell?.setId === setItem.id &&
                                  editingCell.field === 'weight'
                                ) {
                                  void onCommitCell(exercise, setItem, false);
                                }
                              }}
                              keyboardType="decimal-pad"
                              style={styles.inlineInput}
                              returnKeyType="next"
                            />
                          ) : (
                            <Pressable
                              style={styles.inlineCell}
                              onPress={() => onStartCellEdit(exercise.id, setItem.id, 'weight', setItem.weight)}
                            >
                              <Text style={styles.tableCellText}>{setItem.weight}</Text>
                            </Pressable>
                          )}
                        </View>

                        <View style={styles.colReps}>
                          {editReps ? (
                            <TextInput
                              autoFocus
                              value={editingCell?.value ?? ''}
                              onChangeText={(value) =>
                                setEditingCell((current) => (current ? { ...current, value } : current))
                              }
                              onSubmitEditing={() => {
                                void onCommitCell(exercise, setItem, false);
                              }}
                              onBlur={() => {
                                if (
                                  editingCell?.exerciseId === exercise.id &&
                                  editingCell?.setId === setItem.id &&
                                  editingCell.field === 'reps'
                                ) {
                                  void onCommitCell(exercise, setItem, false);
                                }
                              }}
                              keyboardType="number-pad"
                              style={styles.inlineInput}
                              returnKeyType="done"
                            />
                          ) : (
                            <Pressable
                              style={styles.inlineCell}
                              onPress={() => onStartCellEdit(exercise.id, setItem.id, 'reps', setItem.reps)}
                            >
                              <Text style={styles.tableCellText}>{setItem.reps}</Text>
                            </Pressable>
                          )}
                        </View>

                        <View style={styles.colDone}>
                          <Pressable
                            style={[styles.donePill, setItem.completed && styles.donePillActive]}
                            onPress={() => onToggleSetDone(setItem.id, setItem.completed)}
                          >
                            <Text style={[styles.donePillText, setItem.completed && styles.donePillTextActive]}>
                              {setItem.completed ? 'OK' : 'Tap'}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    </Swipeable>
                  );
                })}

                <AppButton onPress={() => onAddSet(exercise)}>+ Add Set</AppButton>

                {feedback ? (
                  <Text style={styles.feedbackText}>
                    Delta: {feedback.difference_weight ?? 0}kg / {feedback.difference_reps ?? 0} reps
                    {feedback.pr ? ' | PR' : ''}
                  </Text>
                ) : null}

                {suggestion ? (
                  <Text style={styles.suggestionText}>
                    Suggested next: {suggestion.next_weight_kg}kg x {suggestion.next_reps}
                  </Text>
                ) : null}
              </AppCard>
            );
          })}
        </ScrollView>

        <StickyActionBar>
          {!activeWorkout ? (
            <AppButton onPress={onStartWorkout}>{busy ? 'Starting...' : 'Start Workout'}</AppButton>
          ) : (
            <View style={styles.stickyRow}>
              <AppButton style={styles.stickyHalf} variant="secondary" onPress={() => setLibraryOpen(true)}>
                Add Exercise
              </AppButton>
              <AppButton style={styles.stickyHalf} onPress={onFinishWorkout}>
                Finish Workout
              </AppButton>
            </View>
          )}
        </StickyActionBar>
      </View>

      <Modal visible={libraryOpen} animationType="slide" transparent onRequestClose={() => setLibraryOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setLibraryOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            <FlatList
              data={filteredLibraryRows}
              keyExtractor={(item) => String(item.id)}
              stickyHeaderIndices={[0]}
              contentContainerStyle={styles.sheetListContent}
              ListHeaderComponent={
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Exercise Library</Text>
                  <AppInput
                    value={libraryQuery}
                    onChangeText={setLibraryQuery}
                    placeholder="Search exercises"
                  />

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                    {dynamicMuscles.map((item) => (
                      <AppChip
                        key={item}
                        label={item}
                        selected={selectedMuscle === item}
                        onPress={() => setSelectedMuscle(item)}
                      />
                    ))}
                  </ScrollView>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                    {EQUIPMENT_FILTERS.map((item) => (
                      <AppChip
                        key={item}
                        label={item}
                        selected={selectedEquipment === item}
                        onPress={() => setSelectedEquipment(item)}
                      />
                    ))}
                  </ScrollView>

                  {recentItems.length ? (
                    <View style={styles.recentWrap}>
                      <Text style={styles.recentTitle}>Recent</Text>
                      <View style={styles.recentItemsRow}>
                        {recentItems.map((item) => (
                          <Pressable
                            key={item.id}
                            style={styles.recentPill}
                            onPress={() => {
                              void onAddExercise(item);
                            }}
                          >
                            <Text style={styles.recentPillText}>{item.name}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ) : null}

                  <AppButton variant="ghost" onPress={() => setCreateOpen(true)}>
                    + Create Custom Exercise
                  </AppButton>

                  {libraryLoading ? <Text style={styles.loadingText}>Searching...</Text> : null}
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.libraryRow}>
                  <View style={styles.libraryImage}>
                    <Text style={styles.libraryImageText}>{toInitials(item.name)}</Text>
                  </View>

                  <View style={styles.libraryMain}>
                    <Text style={styles.libraryName}>{item.name}</Text>
                    <Text style={styles.libraryMeta}>
                      {item.muscle_group} / {item.equipment}
                    </Text>
                  </View>

                  <View style={styles.libraryActions}>
                    <Pressable
                      style={styles.favoriteButton}
                      onPress={() => onToggleFavorite(item.id)}
                    >
                      <Text style={styles.favoriteText}>{favoriteIds[item.id] ? 'Fav' : 'Save'}</Text>
                    </Pressable>
                    <AppButton
                      style={styles.addLibraryButton}
                      onPress={() => {
                        void onAddExercise(item);
                      }}
                    >
                      Add
                    </AppButton>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                !libraryLoading ? (
                  <Text style={styles.emptyLibraryText}>No exercises found for this filter.</Text>
                ) : null
              }
            />
          </View>
        </View>
      </Modal>

      <Modal visible={createOpen} animationType="slide" transparent onRequestClose={() => setCreateOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setCreateOpen(false)} />
          <View style={styles.createSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add Exercise</Text>
            <AppInput value={customName} onChangeText={setCustomName} placeholder="Exercise name" />
            <AppInput value={customMuscle} onChangeText={setCustomMuscle} placeholder="Muscle group" />
            <AppInput value={customEquipment} onChangeText={setCustomEquipment} placeholder="Equipment" />
            <AppButton variant="ghost" onPress={() => undefined}>
              Attach image/video (optional)
            </AppButton>

            <View style={styles.createActions}>
              <AppButton style={styles.createHalf} variant="secondary" onPress={() => setCreateOpen(false)}>
                Cancel
              </AppButton>
              <AppButton style={styles.createHalf} onPress={onCreateCustomExercise}>
                Add to Workout
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
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 140,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  connectionBadge: {
    minWidth: 42,
    textAlign: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.primary,
    backgroundColor: colors.backgroundElevated,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  errorBanner: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#5B2A38',
    backgroundColor: '#39212A',
    padding: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.caption,
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  cardBody: {
    color: colors.mutedText,
    fontSize: typography.body,
  },
  exerciseCard: {
    gap: spacing.sm,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    alignItems: 'center',
  },
  exerciseTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  exerciseSubtitle: {
    marginTop: 2,
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  exerciseTag: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
    paddingHorizontal: 10,
    color: colors.primary,
    fontSize: typography.caption,
    textTransform: 'capitalize',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  tableHeaderText: {
    color: colors.mutedText,
    fontSize: typography.tiny,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated,
    paddingHorizontal: spacing.sm,
    marginTop: 6,
  },
  tableRowDone: {
    borderColor: '#36633A',
    backgroundColor: '#10261A',
  },
  tableCellText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  colSet: {
    flex: 0.8,
  },
  colWeight: {
    flex: 1.6,
    alignItems: 'center',
  },
  colReps: {
    flex: 1.4,
    alignItems: 'center',
  },
  colDone: {
    flex: 1,
    alignItems: 'center',
  },
  inlineCell: {
    minHeight: 38,
    minWidth: 72,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  inlineInput: {
    minHeight: 38,
    minWidth: 72,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.background,
    color: colors.text,
    textAlign: 'center',
    paddingHorizontal: 6,
    fontSize: typography.body,
    fontWeight: '600',
  },
  donePill: {
    minHeight: 34,
    minWidth: 60,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 8,
  },
  donePillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  donePillText: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  donePillTextActive: {
    color: colors.primaryText,
  },
  deleteAction: {
    marginTop: 6,
    marginLeft: spacing.sm,
    borderRadius: radius.md,
    width: 84,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A222F',
    borderWidth: 1,
    borderColor: '#6B2E3E',
  },
  deleteActionText: {
    color: colors.danger,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  feedbackText: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  suggestionText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  stickyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stickyHalf: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 10, 18, 0.58)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    maxHeight: '84%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    backgroundColor: colors.background,
    paddingTop: 8,
  },
  createSheet: {
    maxHeight: '68%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: 8,
    paddingBottom: 22,
    gap: spacing.sm,
  },
  sheetHandle: {
    alignSelf: 'center',
    height: 4,
    width: 54,
    borderRadius: radius.pill,
    backgroundColor: '#355373',
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '700',
    marginBottom: 2,
  },
  sheetListContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 22,
    gap: spacing.sm,
  },
  sheetHeader: {
    backgroundColor: colors.background,
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  chipsRow: {
    gap: 8,
    paddingRight: spacing.md,
  },
  recentWrap: {
    gap: 8,
  },
  recentTitle: {
    color: colors.mutedText,
    fontSize: typography.caption,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  recentItemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentPill: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  recentPillText: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  loadingText: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  libraryRow: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  libraryImage: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  libraryImageText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  libraryMain: {
    flex: 1,
    gap: 2,
  },
  libraryName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  libraryMeta: {
    color: colors.mutedText,
    fontSize: typography.caption,
    textTransform: 'capitalize',
  },
  libraryActions: {
    gap: 6,
    alignItems: 'flex-end',
  },
  favoriteButton: {
    minHeight: 30,
    minWidth: 56,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  favoriteText: {
    color: colors.primary,
    fontSize: typography.tiny,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  addLibraryButton: {
    minWidth: 74,
    minHeight: 34,
  },
  emptyLibraryText: {
    marginTop: spacing.md,
    color: colors.mutedText,
    textAlign: 'center',
    fontSize: typography.body,
  },
  createActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  createHalf: {
    flex: 1,
  },
});
