import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useWorkoutFlow } from '../../shared/state/WorkoutFlowContext';
import type { ExerciseItem, LoggedSet, WorkoutExerciseState } from '../../shared/api/workoutApi';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';
import { useDeviceReader } from '../../shared/device/useDeviceReader';

type WorkoutNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type SetType = 'N' | 'W' | 'D' | 'F';

type DraftSet = {
  weight: string;
  reps: string;
};

const TYPE_CYCLE: SetType[] = ['N', 'W', 'D', 'F'];

function parsePositiveFloat(value: string): number {
  const parsed = Number.parseFloat(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function parsePositiveInt(value: string): number {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function nextType(type: SetType): SetType {
  const index = TYPE_CYCLE.indexOf(type);
  return TYPE_CYCLE[(index + 1) % TYPE_CYCLE.length];
}

type LoggedSetRowProps = {
  index: number;
  item: LoggedSet;
};

const LoggedSetRow = memo(function LoggedSetRow({ index, item }: LoggedSetRowProps) {
  return (
    <View style={[styles.row, item.completed ? styles.rowCompleted : styles.rowDefault]}>
      <View style={styles.setTypePill}>
        <Text style={styles.setTypeText}>{index + 1}</Text>
      </View>
      <Text style={[styles.valueText, styles.weightCell]}>{item.weight}</Text>
      <Text style={[styles.valueText, styles.repsCell]}>{item.reps}</Text>
      <View style={styles.checkButtonDone}>
        <Text style={styles.checkTextDone}>✓</Text>
      </View>
    </View>
  );
});

type QuickSetRowProps = {
  exercise: WorkoutExerciseState;
  setType: SetType;
  draft: DraftSet;
  locked: boolean;
  onSetTypePress: () => void;
  onWeightChange: (value: string) => void;
  onRepsChange: (value: string) => void;
  onCheck: () => void;
};

const QuickSetRow = memo(function QuickSetRow({
  exercise,
  setType,
  draft,
  locked,
  onSetTypePress,
  onWeightChange,
  onRepsChange,
  onCheck,
}: QuickSetRowProps) {
  const setNumber = exercise.sets.length + 1;

  return (
    <View style={[styles.row, locked ? styles.rowCompleted : styles.rowDefault]}>
      <Pressable style={styles.setTypePill} onPress={onSetTypePress} disabled={locked}>
        <Text style={styles.setTypeText}>{setNumber}{setType}</Text>
      </Pressable>

      <TextInput
        value={draft.weight}
        onChangeText={onWeightChange}
        editable={!locked}
        keyboardType="decimal-pad"
        style={[styles.input, styles.weightCell, locked && styles.inputLocked]}
        placeholder="0"
        placeholderTextColor="#666"
        returnKeyType="next"
      />

      <TextInput
        value={draft.reps}
        onChangeText={onRepsChange}
        editable={!locked}
        keyboardType="number-pad"
        style={[styles.input, styles.repsCell, locked && styles.inputLocked]}
        placeholder="0"
        placeholderTextColor="#666"
        returnKeyType="done"
      />

      <Pressable style={[styles.checkButton, locked && styles.checkButtonDone]} onPress={onCheck} disabled={locked}>
        <Text style={[styles.checkText, locked && styles.checkTextDone]}>✓</Text>
      </Pressable>
    </View>
  );
});

export function WorkoutScreen() {
  const navigation = useNavigation<WorkoutNavigationProp>();
  const {
    activeWorkout,
    workoutState,
    busy,
    error,
    clearError,
    isWorkoutMinimized,
    minimizeWorkout,
    restoreWorkout,
    startOrResumeWorkout,
    finishActiveWorkout,
    addExerciseToActiveWorkout,
    logSetForActiveWorkout,
    searchExerciseLibrary,
  } = useWorkoutFlow();
  const { safeAreaPadding, horizontalGutter } = useDeviceReader();

  const [typesByExercise, setTypesByExercise] = useState<Record<string, SetType>>({});
  const [draftsByExercise, setDraftsByExercise] = useState<Record<string, DraftSet>>({});
  const [lockedByExercise, setLockedByExercise] = useState<Record<string, boolean>>({});
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryItems, setLibraryItems] = useState<ExerciseItem[]>([]);
  const [libraryQuery, setLibraryQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('all');
  const [equipmentFilter, setEquipmentFilter] = useState('all');
  const [selectedById, setSelectedById] = useState<Record<number, boolean>>({});
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const exercises = useMemo(
    () => [...(workoutState?.exercises ?? [])].sort((a, b) => a.ordering - b.ordering),
    [workoutState?.exercises]
  );

  const selectedCount = useMemo(
    () => Object.values(selectedById).filter(Boolean).length,
    [selectedById]
  );

  const muscleOptions = useMemo(() => {
    const options = new Set<string>(['all']);
    libraryItems.forEach((item) => {
      const value = item.muscle_group?.trim().toLowerCase();
      if (value) {
        options.add(value);
      }
    });
    return Array.from(options).slice(0, 12);
  }, [libraryItems]);

  const equipmentOptions = useMemo(() => {
    const options = new Set<string>(['all']);
    libraryItems.forEach((item) => {
      const value = item.equipment?.trim().toLowerCase();
      if (value) {
        options.add(value);
      }
    });
    return Array.from(options).slice(0, 12);
  }, [libraryItems]);

  const filteredLibraryItems = useMemo(() => {
    const normalizedQuery = libraryQuery.trim().toLowerCase();
    return libraryItems.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.muscle_group.toLowerCase().includes(normalizedQuery) ||
        item.equipment.toLowerCase().includes(normalizedQuery);
      const matchesMuscle = muscleFilter === 'all' || item.muscle_group.toLowerCase().includes(muscleFilter);
      const matchesEquipment =
        equipmentFilter === 'all' || item.equipment.toLowerCase().includes(equipmentFilter);

      return matchesQuery && matchesMuscle && matchesEquipment;
    });
  }, [equipmentFilter, libraryItems, libraryQuery, muscleFilter]);

  useEffect(() => {
    if (!libraryOpen) {
      return;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      setLibraryLoading(true);
      void searchExerciseLibrary(libraryQuery || undefined, muscleFilter === 'all' ? undefined : muscleFilter)
        .then((rows) => {
          setLibraryItems(rows);
        })
        .catch(() => {
          setLibraryItems([]);
        })
        .finally(() => {
          setLibraryLoading(false);
        });
    }, 160);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [libraryOpen, libraryQuery, muscleFilter, searchExerciseLibrary]);

  const startWorkout = useCallback(async () => {
    try {
      await startOrResumeWorkout();
    } catch {
      // Handled by context error state.
    }
  }, [startOrResumeWorkout]);

  const openLibrary = useCallback(async () => {
    try {
      if (!activeWorkout) {
        await startOrResumeWorkout();
      }
      setLibraryOpen(true);
    } catch {
      // Handled by context error state.
    }
  }, [activeWorkout, startOrResumeWorkout]);

  const toggleLibrarySelection = useCallback((id: number) => {
    setSelectedById((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }, []);

  const addSelectedExercises = useCallback(async () => {
    const selected = filteredLibraryItems.filter((item) => selectedById[item.id]);
    if (!selected.length) {
      return;
    }

    const existingIds = new Set(exercises.map((item) => item.exercise_id));
    const deduped = selected.filter((item) => !existingIds.has(item.id));

    for (const item of deduped) {
      await addExerciseToActiveWorkout({ exercise_id: item.id });
    }

    setSelectedById({});
    setLibraryOpen(false);
  }, [addExerciseToActiveWorkout, exercises, filteredLibraryItems, selectedById]);

  const finishWorkout = useCallback(async () => {
    if (!activeWorkout) {
      return;
    }

    try {
      await finishActiveWorkout();
      navigation.navigate('WorkoutSummary', {
        durationMinutes: 0,
        totalVolume: 0,
        totalSets: 0,
        personalRecord: null,
        insight: null,
      });
    } catch {
      // Handled by context error state.
    }
  }, [activeWorkout, finishActiveWorkout, navigation]);

  const onMinimize = useCallback(() => {
    minimizeWorkout();
    navigation.navigate('MainTabs');
  }, [minimizeWorkout, navigation]);

  const toggleType = useCallback((exerciseId: string) => {
    setTypesByExercise((current) => {
      const currentType = current[exerciseId] ?? 'N';
      return {
        ...current,
        [exerciseId]: nextType(currentType),
      };
    });
  }, []);

  const setDraftWeight = useCallback((exerciseId: string, value: string) => {
    const numeric = value.replace(/[^0-9.,]/g, '');
    setDraftsByExercise((current) => ({
      ...current,
      [exerciseId]: {
        weight: numeric,
        reps: current[exerciseId]?.reps ?? '8',
      },
    }));
  }, []);

  const setDraftReps = useCallback((exerciseId: string, value: string) => {
    const numeric = value.replace(/[^0-9]/g, '');
    setDraftsByExercise((current) => ({
      ...current,
      [exerciseId]: {
        weight: current[exerciseId]?.weight ?? '20',
        reps: numeric,
      },
    }));
  }, []);

  const checkSet = useCallback(
    async (exercise: WorkoutExerciseState) => {
      const draft = draftsByExercise[exercise.id] ?? { weight: '20', reps: '8' };
      const weight = parsePositiveFloat(draft.weight);
      const reps = parsePositiveInt(draft.reps);
      if (!weight || !reps) {
        return;
      }

      setLockedByExercise((current) => ({ ...current, [exercise.id]: true }));
      try {
        await logSetForActiveWorkout({
          workout_exercise_id: exercise.id,
          weight,
          reps,
          rpe: 8,
          duration: 60,
          completed: true,
        });

        setDraftsByExercise((current) => ({
          ...current,
          [exercise.id]: { weight: String(weight), reps: String(reps) },
        }));
      } catch {
        setLockedByExercise((current) => ({ ...current, [exercise.id]: false }));
        return;
      }

      setTimeout(() => {
        setLockedByExercise((current) => ({ ...current, [exercise.id]: false }));
      }, 180);
    },
    [draftsByExercise, logSetForActiveWorkout]
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { paddingTop: safeAreaPadding.paddingTop, paddingBottom: safeAreaPadding.paddingBottom }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <View style={[styles.container, { paddingHorizontal: horizontalGutter }]}> 
        <View style={styles.header}>
          <Pressable style={styles.minimizeButton} onPress={onMinimize} disabled={!activeWorkout}>
            <Text style={[styles.minimizeButtonText, !activeWorkout && styles.minimizeButtonTextDisabled]}>∨</Text>
          </Pressable>
          <View>
            <Text style={styles.title}>Workout</Text>
            <Text style={styles.subtitle}>{activeWorkout ? 'Session active' : 'Ready'}</Text>
          </View>
          <View style={styles.actions}>
            {!activeWorkout ? (
              <Pressable style={styles.startButton} onPress={() => void startWorkout()} disabled={busy}>
                {busy ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.startButtonText}>Start Workout</Text>
                )}
              </Pressable>
            ) : (
              <View style={styles.activeActions}>
                <Pressable style={styles.addButton} onPress={() => void openLibrary()}>
                  <Text style={styles.addButtonText}>+ Add</Text>
                </Pressable>
                <Pressable style={styles.finishButton} onPress={() => void finishWorkout()}>
                  <Text style={styles.finishButtonText}>Finish</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {error ? (
          <Pressable style={styles.errorBanner} onPress={clearError}>
            <Text style={styles.errorText}>{error}</Text>
          </Pressable>
        ) : null}

        {isWorkoutMinimized ? (
          <View style={styles.minimizedPlaceholder}>
            <Text style={styles.minimizedText}>Workout minimized</Text>
            <Pressable style={styles.restoreButton} onPress={restoreWorkout}>
              <Text style={styles.restoreButtonText}>Restore</Text>
            </Pressable>
          </View>
        ) : null}

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          pointerEvents={isWorkoutMinimized ? 'none' : 'auto'}
          style={isWorkoutMinimized ? styles.hiddenScroll : undefined}
        >
          {exercises.map((exercise) => {
            const draft = draftsByExercise[exercise.id] ?? { weight: '20', reps: '8' };
            const type = typesByExercise[exercise.id] ?? 'N';
            const locked = Boolean(lockedByExercise[exercise.id]);

            return (
              <View key={exercise.id} style={styles.exerciseCard}>
                <Text style={styles.exerciseTitle}>{exercise.name}</Text>

                {exercise.sets.map((setItem, index) => (
                  <LoggedSetRow key={setItem.id} index={index} item={setItem} />
                ))}

                <QuickSetRow
                  exercise={exercise}
                  setType={type}
                  draft={draft}
                  locked={locked}
                  onSetTypePress={() => toggleType(exercise.id)}
                  onWeightChange={(value) => setDraftWeight(exercise.id, value)}
                  onRepsChange={(value) => setDraftReps(exercise.id, value)}
                  onCheck={() => void checkSet(exercise)}
                />
              </View>
            );
          })}

          {activeWorkout && exercises.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No exercises yet</Text>
              <Text style={styles.emptySubtitle}>Add exercises first, then log sets instantly.</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>

      <Modal visible={libraryOpen} animationType="slide" transparent onRequestClose={() => setLibraryOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setLibraryOpen(false)} />
          <View style={styles.librarySheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.libraryTitle}>Exercise Library</Text>

            <TextInput
              value={libraryQuery}
              onChangeText={setLibraryQuery}
              placeholder="Search by keyword"
              placeholderTextColor="#666"
              style={styles.librarySearch}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {muscleOptions.map((option) => (
                <Pressable
                  key={`muscle-${option}`}
                  style={[styles.filterChip, muscleFilter === option && styles.filterChipActive]}
                  onPress={() => setMuscleFilter(option)}
                >
                  <Text style={[styles.filterChipText, muscleFilter === option && styles.filterChipTextActive]}>{option}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {equipmentOptions.map((option) => (
                <Pressable
                  key={`equip-${option}`}
                  style={[styles.filterChip, equipmentFilter === option && styles.filterChipActive]}
                  onPress={() => setEquipmentFilter(option)}
                >
                  <Text style={[styles.filterChipText, equipmentFilter === option && styles.filterChipTextActive]}>{option}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {libraryLoading ? <Text style={styles.libraryStatus}>Loading...</Text> : null}

            <FlatList
              data={filteredLibraryItems}
              keyExtractor={(item) => String(item.id)}
              style={styles.libraryList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const selected = Boolean(selectedById[item.id]);
                return (
                  <Pressable
                    style={[styles.libraryRow, selected && styles.libraryRowSelected]}
                    onPress={() => toggleLibrarySelection(item.id)}
                  >
                    {item.image_url ? (
                      <Image source={{ uri: item.image_url }} style={styles.libraryThumb} resizeMode="cover" />
                    ) : null}
                    <View style={styles.libraryMain}>
                      <Text style={styles.libraryName}>{item.name}</Text>
                      <Text style={styles.libraryMeta}>{item.muscle_group} • {item.equipment}</Text>
                      {item.video_url ? <Text style={styles.libraryMeta}>Video available</Text> : null}
                    </View>
                    <View style={[styles.checkmarkCircle, selected && styles.checkmarkCircleActive]}>
                      <Text style={[styles.checkmarkText, selected && styles.checkmarkTextActive]}>
                        {selected ? '✓' : ''}
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
              ListEmptyComponent={!libraryLoading ? <Text style={styles.libraryStatus}>No exercises found.</Text> : null}
            />

            <View style={styles.libraryFooter}>
              <Pressable style={styles.footerButtonSecondary} onPress={() => setLibraryOpen(false)}>
                <Text style={styles.footerButtonSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.footerButtonPrimary} onPress={() => void addSelectedExercises()}>
                <Text style={styles.footerButtonPrimaryText}>Add Selected ({selectedCount})</Text>
              </Pressable>
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
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  minimizeButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  minimizeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 18,
  },
  minimizeButtonTextDisabled: {
    color: '#555',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#999',
    fontSize: 12,
  },
  actions: {
    alignItems: 'flex-end',
  },
  activeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButton: {
    minWidth: 72,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  startButton: {
    minWidth: 132,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 13,
  },
  finishButton: {
    minWidth: 96,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  errorBanner: {
    borderWidth: 1,
    borderColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  errorText: {
    color: '#fff',
    fontSize: 12,
  },
  content: {
    paddingBottom: 120,
    gap: 10,
  },
  hiddenScroll: {
    opacity: 0,
  },
  minimizedPlaceholder: {
    borderWidth: 1,
    borderColor: '#1f1f1f',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#050505',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  minimizedText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  restoreButton: {
    minWidth: 86,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  exerciseCard: {
    borderWidth: 1,
    borderColor: '#1f1f1f',
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#000',
    gap: 8,
  },
  exerciseTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  row: {
    minHeight: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 6,
  },
  rowDefault: {
    backgroundColor: '#0b0b0b',
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  rowCompleted: {
    backgroundColor: '#16a34a',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  setTypePill: {
    width: 56,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  setTypeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 4,
    backgroundColor: '#000',
    fontSize: 15,
    fontWeight: '600',
  },
  inputLocked: {
    color: '#dcfce7',
    borderColor: '#15803d',
    backgroundColor: '#15803d',
  },
  valueText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
  },
  weightCell: {
    flex: 1,
  },
  repsCell: {
    flex: 1,
  },
  checkButton: {
    width: 38,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  checkButtonDone: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  checkText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 16,
  },
  checkTextDone: {
    color: '#dcfce7',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 16,
  },
  emptyState: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#050505',
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  emptySubtitle: {
    marginTop: 4,
    color: '#999',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  librarySheet: {
    maxHeight: '86%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 20,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3f3f3f',
    marginBottom: 8,
  },
  libraryTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  librarySearch: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    color: '#fff',
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  filterRow: {
    gap: 8,
    paddingBottom: 8,
  },
  filterChip: {
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    backgroundColor: '#050505',
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    borderColor: '#fff',
    backgroundColor: '#fff',
  },
  filterChipText: {
    color: '#d0d0d0',
    fontSize: 11,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#000',
  },
  libraryList: {
    marginTop: 4,
    marginBottom: 10,
  },
  libraryRow: {
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 1,
  },
  libraryRowSelected: {
    opacity: 0.55,
    borderColor: '#fff',
  },
  libraryMain: {
    flex: 1,
  },
  libraryThumb: {
    width: 46,
    height: 46,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    backgroundColor: '#111',
  },
  libraryName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  libraryMeta: {
    color: '#a6a6a6',
    fontSize: 11,
    marginTop: 2,
  },
  checkmarkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#5a5a5a',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  checkmarkCircleActive: {
    borderColor: '#fff',
    backgroundColor: '#fff',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 14,
  },
  checkmarkTextActive: {
    color: '#000',
  },
  libraryStatus: {
    color: '#9a9a9a',
    fontSize: 12,
    marginTop: 6,
    marginBottom: 8,
  },
  libraryFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  footerButtonSecondary: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4b4b4b',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  footerButtonSecondaryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  footerButtonPrimary: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  footerButtonPrimaryText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
});
