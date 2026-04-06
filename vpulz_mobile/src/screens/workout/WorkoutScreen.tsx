import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BottomSheetMenu, { type BottomSheetMenuAction } from '../../components/BottomSheetMenu';
import ExerciseCard from '../../components/ExerciseCard';
import type { SetTypeTag } from '../../components/SetRow';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { extractLibraryFilterOptions, fetchWgerExercises } from '../../services/wger/wgerService';
import {
  formatDuration,
  getElapsedSeconds,
  mapExerciseToStore,
  type WorkoutStoreState,
  useWorkoutStore,
} from '../../store';
import type { Exercise } from '../../types/workout';

type WorkoutRouteProp = RouteProp<RootStackParamList, 'ActiveWorkout'>;
type WorkoutNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type ExerciseMenuContext = {
  exerciseId: string;
  index: number;
};

type SetTypeContext = {
  exerciseId: string;
  setId: string;
};

type RirContext = {
  exerciseId: string;
  setId: string;
  metric: 'weight' | 'reps';
};

type DetailTab = 'summary' | 'history' | 'howto' | 'leaderboard';

function formatVolume(totalVolume: number): string {
  return `${Math.round(totalVolume).toLocaleString()} kg`;
}

function sanitizeRir(value: string): string {
  return value.replace(/[^0-9.]/g, '').slice(0, 4);
}

function statLabel(value: string, label: string) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{label}</Text>
    </View>
  );
}

function tabLabel(tab: DetailTab): string {
  if (tab === 'summary') {
    return 'Summary';
  }
  if (tab === 'history') {
    return 'History';
  }
  if (tab === 'howto') {
    return 'How to';
  }
  return 'Leaderboard';
}

export function WorkoutScreen() {
  const navigation = useNavigation<WorkoutNavigationProp>();
  const route = useRoute<WorkoutRouteProp>();
  const insets = useSafeAreaInsets();

  const workouts = useWorkoutStore((state: WorkoutStoreState) => state.workouts);
  const workoutLog = useWorkoutStore((state: WorkoutStoreState) => state.workoutLog);
  const activeWorkoutId = useWorkoutStore((state: WorkoutStoreState) => state.activeWorkoutId);
  const sessionStartedAt = useWorkoutStore((state: WorkoutStoreState) => state.sessionStartedAt);

  const setActiveWorkout = useWorkoutStore((state: WorkoutStoreState) => state.setActiveWorkout);
  const setExerciseNotes = useWorkoutStore((state: WorkoutStoreState) => state.setExerciseNotes);
  const startWorkout = useWorkoutStore((state: WorkoutStoreState) => state.startWorkout);
  const finishWorkout = useWorkoutStore((state: WorkoutStoreState) => state.finishWorkout);
  const minimizeWorkout = useWorkoutStore((state: WorkoutStoreState) => state.minimizeWorkout);

  const addExercise = useWorkoutStore((state: WorkoutStoreState) => state.addExercise);
  const removeExercise = useWorkoutStore((state: WorkoutStoreState) => state.removeExercise);
  const toggleExerciseExpanded = useWorkoutStore((state: WorkoutStoreState) => state.toggleExerciseExpanded);
  const reorderExercise = useWorkoutStore((state: WorkoutStoreState) => state.reorderExercise);
  const addSet = useWorkoutStore((state: WorkoutStoreState) => state.addSet);
  const updateSet = useWorkoutStore((state: WorkoutStoreState) => state.updateSet);
  const removeSet = useWorkoutStore((state: WorkoutStoreState) => state.removeSet);

  const [nowTick, setNowTick] = useState(Date.now());
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('');
  const [libraryItems, setLibraryItems] = useState<Exercise[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);

  const [detailExerciseId, setDetailExerciseId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('summary');

  const [reorderMode, setReorderMode] = useState(false);
  const [exerciseMenuContext, setExerciseMenuContext] = useState<ExerciseMenuContext | null>(null);
  const [replaceExerciseContext, setReplaceExerciseContext] = useState<ExerciseMenuContext | null>(null);

  const [timerPickerOpen, setTimerPickerOpen] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(1);
  const [timerSeconds, setTimerSeconds] = useState(30);

  const [setTypeContext, setSetTypeContext] = useState<SetTypeContext | null>(null);
  const [setTypesBySetId, setSetTypesBySetId] = useState<Record<string, SetTypeTag>>({});

  const [rirContext, setRirContext] = useState<RirContext | null>(null);
  const [rirDraft, setRirDraft] = useState('');
  const [rirBySetId, setRirBySetId] = useState<Record<string, string>>({});

  useEffect(() => {
    const targetFromRoute = route.params?.workoutId;
    if (targetFromRoute) {
      if (targetFromRoute !== activeWorkoutId) {
        setActiveWorkout(targetFromRoute);
      }
      return;
    }

    if (!activeWorkoutId && workouts[0]) {
      setActiveWorkout(workouts[0].id);
    }
  }, [activeWorkoutId, route.params?.workoutId, setActiveWorkout, workouts]);

  useEffect(() => {
    const handle = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => clearInterval(handle);
  }, []);

  useEffect(() => {
    if (!libraryOpen) {
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(() => {
      setIsLibraryLoading(true);
      setLibraryError(null);

      void fetchWgerExercises({
        query,
        muscle: muscleFilter || undefined,
        equipment: equipmentFilter || undefined,
        limit: 30,
      })
        .then((result) => {
          if (cancelled) {
            return;
          }
          setLibraryItems(result);
        })
        .catch((reason: unknown) => {
          if (cancelled) {
            return;
          }
          setLibraryError(reason instanceof Error ? reason.message : 'Unable to load exercise library.');
          setLibraryItems([]);
        })
        .finally(() => {
          if (!cancelled) {
            setIsLibraryLoading(false);
          }
        });
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [equipmentFilter, libraryOpen, muscleFilter, query]);

  const activeWorkout = useMemo(
    () => workouts.find((workout) => workout.id === activeWorkoutId) ?? null,
    [activeWorkoutId, workouts]
  );

  useEffect(() => {
    if (!activeWorkout || sessionStartedAt) {
      return;
    }
    startWorkout(activeWorkout.id);
  }, [activeWorkout, sessionStartedAt, startWorkout]);

  const totalSets = useMemo(() => {
    if (!activeWorkout) {
      return 0;
    }
    return activeWorkout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  }, [activeWorkout]);

  const completedSets = useMemo(() => {
    if (!activeWorkout) {
      return 0;
    }
    return activeWorkout.exercises.reduce(
      (sum, exercise) => sum + exercise.sets.filter((setItem) => setItem.completed).length,
      0
    );
  }, [activeWorkout]);

  const totalVolume = useMemo(() => {
    if (!activeWorkout) {
      return 0;
    }

    return activeWorkout.exercises.reduce(
      (sum, exercise) =>
        sum + exercise.sets.reduce((exerciseSum, setItem) => exerciseSum + setItem.weight * setItem.reps, 0),
      0
    );
  }, [activeWorkout]);

  const elapsed = useMemo(() => getElapsedSeconds(sessionStartedAt), [sessionStartedAt, nowTick]);

  const previousHintsByExercise = useMemo(() => {
    const lookup = new Map<string, string>();
    workoutLog.forEach((workout) => {
      workout.exercises.forEach((exercise) => {
        const key = exercise.name.trim().toLowerCase();
        if (lookup.has(key)) {
          return;
        }
        lookup.set(key, `${exercise.weight} x ${exercise.reps}`);
      });
    });
    return lookup;
  }, [workoutLog]);

  const filterOptions = useMemo(() => extractLibraryFilterOptions(libraryItems), [libraryItems]);

  const handleFinish = () => {
    const result = finishWorkout();
    if (!result) {
      return;
    }
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  const handleDiscard = () => {
    setActiveWorkout(null);
    navigation.navigate('MainTabs', { screen: 'Training' });
  };

  const selectedMenuExercise = useMemo(() => {
    if (!activeWorkout || !exerciseMenuContext) {
      return null;
    }
    return activeWorkout.exercises.find((exercise) => exercise.id === exerciseMenuContext.exerciseId) ?? null;
  }, [activeWorkout, exerciseMenuContext]);

  const detailExercise = useMemo(() => {
    if (!activeWorkout || !detailExerciseId) {
      return null;
    }
    return activeWorkout.exercises.find((exercise) => exercise.id === detailExerciseId) ?? null;
  }, [activeWorkout, detailExerciseId]);

  const detailHistory = useMemo(() => {
    if (!detailExercise) {
      return [];
    }

    const normalized = detailExercise.name.trim().toLowerCase();

    return workoutLog
      .filter((entry) => entry.exercises.some((exercise) => exercise.name.trim().toLowerCase() === normalized))
      .slice(0, 8)
      .map((entry) => {
        const found = entry.exercises.find((exercise) => exercise.name.trim().toLowerCase() === normalized);
        return {
          id: entry.id,
          date: entry.date,
          label: found ? `${found.weight}kg x ${found.reps}` : '-',
        };
      });
  }, [detailExercise, workoutLog]);

  const summaryBars = useMemo(() => {
    if (!detailExercise) {
      return [];
    }

    const weights = detailExercise.sets.map((setItem) => setItem.weight).slice(-6);
    const maxWeight = Math.max(...weights, 1);

    return weights.map((weight, index) => ({
      id: `${detailExercise.id}-${index}`,
      ratio: Math.max(0.08, weight / maxWeight),
      label: String(weight),
    }));
  }, [detailExercise]);

  const timerSelectionLabel = useMemo(() => {
    if (timerMinutes === 0 && timerSeconds === 0) {
      return 'OFF';
    }
    return `${String(timerMinutes).padStart(2, '0')}:${String(timerSeconds).padStart(2, '0')}`;
  }, [timerMinutes, timerSeconds]);

  const setTypeActions: BottomSheetMenuAction[] = [
    {
      id: 'warmup',
      label: 'W (Warmup)',
      onPress: () => {
        if (!setTypeContext) {
          return;
        }
        setSetTypesBySetId((current) => ({ ...current, [setTypeContext.setId]: 'warmup' }));
      },
    },
    {
      id: 'failure',
      label: 'F (Failure)',
      onPress: () => {
        if (!setTypeContext) {
          return;
        }
        setSetTypesBySetId((current) => ({ ...current, [setTypeContext.setId]: 'failure' }));
      },
    },
    {
      id: 'dropset',
      label: 'D (Dropset)',
      onPress: () => {
        if (!setTypeContext) {
          return;
        }
        setSetTypesBySetId((current) => ({ ...current, [setTypeContext.setId]: 'dropset' }));
      },
    },
    {
      id: 'normal',
      label: 'Normal',
      onPress: () => {
        if (!setTypeContext) {
          return;
        }
        setSetTypesBySetId((current) => ({ ...current, [setTypeContext.setId]: 'normal' }));
      },
    },
  ];

  const exerciseMenuActions: BottomSheetMenuAction[] = [
    {
      id: 'reorder',
      label: reorderMode ? 'Done Reordering' : 'Reorder Exercises',
      onPress: () => setReorderMode((current) => !current),
    },
    {
      id: 'replace',
      label: 'Replace Exercise',
      onPress: () => {
        if (!exerciseMenuContext) {
          return;
        }
        setReplaceExerciseContext(exerciseMenuContext);
        setLibraryOpen(true);
      },
    },
    {
      id: 'superset',
      label: 'Add to Superset',
      onPress: () => {
        if (!activeWorkout || !selectedMenuExercise) {
          return;
        }
        const notes = selectedMenuExercise.notes ?? '';
        const hasTag = notes.includes('[Superset]');
        const nextNotes = hasTag ? notes.replace('[Superset]', '').trim() : `[Superset] ${notes}`.trim();
        setExerciseNotes(activeWorkout.id, selectedMenuExercise.id, nextNotes);
      },
    },
    {
      id: 'remove',
      label: 'Remove Exercise',
      destructive: true,
      onPress: () => {
        if (!activeWorkout || !selectedMenuExercise) {
          return;
        }
        removeExercise(activeWorkout.id, selectedMenuExercise.id);
      },
    },
  ];

  const addExerciseFromLibrary = (exercise: Exercise) => {
    if (!activeWorkout) {
      return;
    }

    if (replaceExerciseContext) {
      const originalCount = activeWorkout.exercises.length;
      const targetIndex = replaceExerciseContext.index;
      const targetExerciseId = replaceExerciseContext.exerciseId;

      addExercise(mapExerciseToStore(activeWorkout.id, exercise));
      removeExercise(activeWorkout.id, targetExerciseId);

      const sourceIndexAfterReplace = Math.max(0, originalCount - 1);
      const destinationIndex = Math.min(targetIndex, Math.max(0, originalCount - 1));
      if (sourceIndexAfterReplace !== destinationIndex) {
        reorderExercise(activeWorkout.id, sourceIndexAfterReplace, destinationIndex);
      }
      setReplaceExerciseContext(null);
    } else {
      addExercise(mapExerciseToStore(activeWorkout.id, exercise));
    }

    setLibraryOpen(false);
    setQuery('');
    setMuscleFilter('');
    setEquipmentFilter('');
  };

  const saveRir = () => {
    if (!activeWorkout || !rirContext) {
      return;
    }

    const nextRir = sanitizeRir(rirDraft);

    setRirBySetId((current) => {
      if (!nextRir.length) {
        const { [rirContext.setId]: _, ...rest } = current;
        return rest;
      }
      return { ...current, [rirContext.setId]: nextRir };
    });

    const targetExercise = activeWorkout.exercises.find((exercise) => exercise.id === rirContext.exerciseId);
    const targetSet = targetExercise?.sets.find((setItem) => setItem.id === rirContext.setId);
    if (targetSet) {
      const baseNote = (targetSet.note ?? '').replace(/\s*\|?\s*RIR:\s*[0-9.]+/gi, '').trim();
      const noteWithRir = nextRir.length ? `${baseNote ? `${baseNote} | ` : ''}RIR: ${nextRir}` : baseNote;
      updateSet(activeWorkout.id, rirContext.exerciseId, rirContext.setId, { note: noteWithRir });
    }

    setRirContext(null);
    setRirDraft('');
  };

  if (!activeWorkout) {
    return (
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <View style={[styles.emptyWorkoutContainer, { paddingTop: insets.top + 20 }]}> 
          <Text style={styles.emptyWorkoutTitle}>No workout selected</Text>
          <Text style={styles.emptyWorkoutText}>Create or pick a workout from Home.</Text>
          <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}>
            <Text style={styles.primaryButtonLabel}>Go to Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 10 }]}> 
        <View style={styles.headerRow}>
          <Pressable
            style={styles.iconCircle}
            onPress={() => {
              minimizeWorkout();
              navigation.navigate('MainTabs', { screen: 'Training' });
            }}
          >
            <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Log Workout</Text>
          </View>

          <View style={styles.headerRight}>
            <Pressable style={styles.iconCircle} onPress={() => setTimerPickerOpen(true)}>
              <Ionicons name="timer-outline" size={18} color="#FFFFFF" />
            </Pressable>
            <Pressable style={styles.finishTopButton} onPress={handleFinish}>
              <Text style={styles.finishTopButtonLabel}>Finish</Text>
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.centerTimer} onPress={() => setTimerPickerOpen(true)}>
          <Text style={styles.centerTimerValue}>{formatDuration(elapsed)}</Text>
          <Text style={styles.centerTimerMeta}>{`Rest ${timerSelectionLabel}`}</Text>
        </Pressable>

        <View style={styles.statsRow}>
          {statLabel(formatDuration(elapsed), 'Duration')}
          {statLabel(formatVolume(totalVolume), 'Volume')}
          {statLabel(`${completedSets}/${Math.max(1, totalSets)}`, 'Sets')}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(32, insets.bottom + 24) }]}
          keyboardShouldPersistTaps="handled"
        >
          {!activeWorkout.exercises.length ? (
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="barbell-outline" size={24} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>Get started</Text>
              <Text style={styles.emptyBody}>Add an exercise to start your workout</Text>
              <Pressable
                style={styles.primaryButton}
                onPress={() => {
                  setReplaceExerciseContext(null);
                  setLibraryOpen(true);
                }}
              >
                <Text style={styles.primaryButtonLabel}>+ Add Exercise</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {activeWorkout.exercises.map((exercise, index) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  previousHint={previousHintsByExercise.get(exercise.name.trim().toLowerCase())}
                  setTypesBySetId={setTypesBySetId}
                  rirBySetId={rirBySetId}
                  reorderMode={reorderMode}
                  onToggleExpand={() => toggleExerciseExpanded(activeWorkout.id, exercise.id)}
                  onOpenExerciseDetail={() => {
                    setDetailExerciseId(exercise.id);
                    setDetailTab('summary');
                  }}
                  onOpenExerciseMenu={() => setExerciseMenuContext({ exerciseId: exercise.id, index })}
                  onAddSet={() => addSet(activeWorkout.id, exercise.id)}
                  onUpdateSet={(setId, patch) => updateSet(activeWorkout.id, exercise.id, setId, patch)}
                  onRemoveSet={(setId) => removeSet(activeWorkout.id, exercise.id, setId)}
                  onSetTypePress={(setId) => setSetTypeContext({ exerciseId: exercise.id, setId })}
                  onLongPressMetric={(setId, metric) => {
                    setRirContext({ exerciseId: exercise.id, setId, metric });
                    setRirDraft(rirBySetId[setId] ?? '');
                  }}
                  onUpdateNotes={(notes) => setExerciseNotes(activeWorkout.id, exercise.id, notes)}
                  onPressRestTimer={() => setTimerPickerOpen(true)}
                  onMoveUp={() => reorderExercise(activeWorkout.id, index, Math.max(0, index - 1))}
                  onMoveDown={() =>
                    reorderExercise(activeWorkout.id, index, Math.min(activeWorkout.exercises.length - 1, index + 1))
                  }
                />
              ))}

              <Pressable
                style={styles.primaryButton}
                onPress={() => {
                  setReplaceExerciseContext(null);
                  setLibraryOpen(true);
                }}
              >
                <Text style={styles.primaryButtonLabel}>+ Add Exercise</Text>
              </Pressable>
            </>
          )}

          <View style={styles.bottomActions}>
            <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('MainTabs', { screen: 'Settings' })}>
              <Text style={styles.secondaryButtonLabel}>Settings</Text>
            </Pressable>
            <Pressable style={styles.discardButton} onPress={handleDiscard}>
              <Text style={styles.discardButtonLabel}>Discard Workout</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>

      <BottomSheetMenu
        visible={Boolean(exerciseMenuContext)}
        onClose={() => setExerciseMenuContext(null)}
        title={selectedMenuExercise?.name ?? 'Exercise'}
        subtitle="Exercise actions"
        snapPoints={['44%']}
        actions={exerciseMenuActions}
      />

      <BottomSheetMenu
        visible={Boolean(setTypeContext)}
        onClose={() => setSetTypeContext(null)}
        title="Set Type"
        subtitle="Choose set marker"
        snapPoints={['38%']}
        actions={setTypeActions}
      />

      <BottomSheetMenu
        visible={Boolean(rirContext)}
        onClose={() => {
          setRirContext(null);
          setRirDraft('');
        }}
        title="RIR"
        subtitle={rirContext ? `Long press ${rirContext.metric.toUpperCase()} to edit` : undefined}
        snapPoints={['36%']}
        actions={[
          { id: 'save-rir', label: 'Save RIR', onPress: saveRir },
          {
            id: 'clear-rir',
            label: 'Clear RIR',
            onPress: () => {
              setRirDraft('');
              saveRir();
            },
          },
        ]}
      >
        <TextInput
          value={rirDraft}
          onChangeText={(value) => setRirDraft(sanitizeRir(value))}
          placeholder="e.g. 2"
          placeholderTextColor="#9CA3AF"
          keyboardType="decimal-pad"
          style={styles.sheetInput}
        />
      </BottomSheetMenu>

      <BottomSheetMenu
        visible={timerPickerOpen}
        onClose={() => setTimerPickerOpen(false)}
        title="Rest Timer"
        subtitle="iOS-style picker"
        snapPoints={['52%']}
        actions={[
          { id: 'apply-rest-timer', label: 'Apply Timer' },
          {
            id: 'disable-rest-timer',
            label: 'Turn Off',
            onPress: () => {
              setTimerMinutes(0);
              setTimerSeconds(0);
            },
          },
        ]}
      >
        <View style={styles.timerPickerRow}>
          <View style={styles.pickerColumn}>
            <Text style={styles.pickerTitle}>Minutes</Text>
            {[0, 1, 2, 3, 4, 5].map((value) => (
              <Pressable
                key={`min-${value}`}
                style={[styles.pickerValueButton, timerMinutes === value ? styles.pickerValueButtonActive : null]}
                onPress={() => setTimerMinutes(value)}
              >
                <Text style={[styles.pickerValueText, timerMinutes === value ? styles.pickerValueTextActive : null]}>{value}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.pickerColumn}>
            <Text style={styles.pickerTitle}>Seconds</Text>
            {[0, 15, 30, 45].map((value) => (
              <Pressable
                key={`sec-${value}`}
                style={[styles.pickerValueButton, timerSeconds === value ? styles.pickerValueButtonActive : null]}
                onPress={() => setTimerSeconds(value)}
              >
                <Text style={[styles.pickerValueText, timerSeconds === value ? styles.pickerValueTextActive : null]}>{value}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </BottomSheetMenu>

      <BottomSheetMenu
        visible={libraryOpen}
        onClose={() => {
          setLibraryOpen(false);
          setReplaceExerciseContext(null);
        }}
        title={replaceExerciseContext ? 'Replace Exercise' : 'Add Exercise'}
        subtitle="Search and filter your exercise list"
        snapPoints={['86%']}
      >
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.sheetInput}
        />

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>All Muscles</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <Pressable
              style={[styles.filterChip, !muscleFilter ? styles.filterChipActive : null]}
              onPress={() => setMuscleFilter('')}
            >
              <Text style={[styles.filterChipText, !muscleFilter ? styles.filterChipTextActive : null]}>All Muscles</Text>
            </Pressable>
            {filterOptions.muscles.slice(0, 10).map((muscle) => (
              <Pressable
                key={muscle}
                style={[styles.filterChip, muscleFilter === muscle ? styles.filterChipActive : null]}
                onPress={() => setMuscleFilter((current) => (current === muscle ? '' : muscle))}
              >
                <Text style={[styles.filterChipText, muscleFilter === muscle ? styles.filterChipTextActive : null]}>{muscle}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>All Equipment</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <Pressable
              style={[styles.filterChip, !equipmentFilter ? styles.filterChipActive : null]}
              onPress={() => setEquipmentFilter('')}
            >
              <Text style={[styles.filterChipText, !equipmentFilter ? styles.filterChipTextActive : null]}>All Equipment</Text>
            </Pressable>
            {filterOptions.equipment.slice(0, 10).map((equipment) => (
              <Pressable
                key={equipment}
                style={[styles.filterChip, equipmentFilter === equipment ? styles.filterChipActive : null]}
                onPress={() => setEquipmentFilter((current) => (current === equipment ? '' : equipment))}
              >
                <Text style={[styles.filterChipText, equipmentFilter === equipment ? styles.filterChipTextActive : null]}>
                  {equipment}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {isLibraryLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#0A84FF" />
            <Text style={styles.loadingText}>Loading exercises...</Text>
          </View>
        ) : null}

        {libraryError ? <Text style={styles.errorText}>{libraryError}</Text> : null}

        {libraryItems.map((exercise) => (
          <Pressable key={exercise.id} style={styles.exerciseListItem} onPress={() => addExerciseFromLibrary(exercise)}>
            <View style={styles.exerciseListThumb}>
              <Ionicons name="barbell-outline" size={14} color="#9CA3AF" />
            </View>
            <View style={styles.exerciseListCopy}>
              <Text style={styles.exerciseListName}>{exercise.name}</Text>
              <Text style={styles.exerciseListMeta}>{exercise.muscles.join(', ') || 'General'}</Text>
            </View>
          </Pressable>
        ))}

        {!isLibraryLoading && !libraryItems.length ? <Text style={styles.emptyLibraryText}>No exercises found.</Text> : null}
      </BottomSheetMenu>

      <BottomSheetMenu
        visible={Boolean(detailExercise)}
        onClose={() => {
          setDetailExerciseId(null);
          setDetailTab('summary');
        }}
        title={detailExercise?.name ?? 'Exercise'}
        subtitle="Exercise details"
        snapPoints={['84%']}
      >
        <View style={styles.detailTabsRow}>
          {(['summary', 'history', 'howto', 'leaderboard'] as DetailTab[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setDetailTab(tab)}
              style={[styles.detailTabButton, detailTab === tab ? styles.detailTabButtonActive : null]}
            >
              <Text style={[styles.detailTabLabel, detailTab === tab ? styles.detailTabLabelActive : null]}>{tabLabel(tab)}</Text>
            </Pressable>
          ))}
        </View>

        {detailTab === 'summary' ? (
          <View style={styles.detailSection}>
            <View style={styles.detailImagePlaceholder}>
              <Ionicons name="barbell-outline" size={28} color="#9CA3AF" />
            </View>

            <Text style={styles.detailSectionTitle}>Muscle groups</Text>
            <View style={styles.muscleChipRow}>
              {(detailExercise?.muscles.length ? detailExercise.muscles : ['General']).map((muscle) => (
                <View key={muscle} style={styles.muscleChip}>
                  <Text style={styles.muscleChipText}>{muscle}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.detailSectionTitle}>PR graph</Text>
            <View style={styles.prGraph}>
              {summaryBars.map((bar) => (
                <View key={bar.id} style={styles.prBarCol}>
                  <View style={[styles.prBar, { height: `${Math.round(bar.ratio * 100)}%` }]} />
                  <Text style={styles.prBarLabel}>{bar.label}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {detailTab === 'history' ? (
          <View style={styles.detailSection}>
            {detailHistory.map((entry) => (
              <View key={entry.id} style={styles.historyRow}>
                <Text style={styles.historyDate}>{entry.date}</Text>
                <Text style={styles.historyValue}>{entry.label}</Text>
              </View>
            ))}
            {!detailHistory.length ? <Text style={styles.emptyLibraryText}>No history yet.</Text> : null}
          </View>
        ) : null}

        {detailTab === 'howto' ? (
          <View style={styles.detailSection}>
            <Text style={styles.howToItem}>1. Set your stance and brace your core.</Text>
            <Text style={styles.howToItem}>2. Control the eccentric phase and keep form clean.</Text>
            <Text style={styles.howToItem}>3. Drive through the concentric with full intent.</Text>
            <Text style={styles.howToItem}>4. Track RIR and progression each session.</Text>
          </View>
        ) : null}

        {detailTab === 'leaderboard' ? (
          <View style={styles.detailSection}>
            <View style={styles.leaderboardRow}>
              <Text style={styles.leaderboardRank}>#1</Text>
              <Text style={styles.leaderboardName}>You</Text>
              <Text style={styles.leaderboardValue}>{summaryBars.length ? `${summaryBars[0].label}kg` : '-'}</Text>
            </View>
            <View style={styles.leaderboardRow}>
              <Text style={styles.leaderboardRank}>#2</Text>
              <Text style={styles.leaderboardName}>Gym Friend</Text>
              <Text style={styles.leaderboardValue}>--</Text>
            </View>
          </View>
        ) : null}
      </BottomSheetMenu>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyWorkoutContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  emptyWorkoutTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  emptyWorkoutText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: '#0B0B0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  finishTopButton: {
    minHeight: 40,
    borderRadius: 14,
    backgroundColor: '#0A84FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  finishTopButtonLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  centerTimer: {
    marginTop: 10,
    alignSelf: 'center',
    minWidth: 138,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: 'rgba(17, 17, 17, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  centerTimerValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  centerTimerMeta: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  statItem: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: '#111111',
    minHeight: 62,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  statTitle: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContent: {
    gap: 12,
    paddingTop: 14,
  },
  emptyStateCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: '#111111',
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  emptyIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: '#0B0B0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  emptyBody: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#0A84FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 4,
  },
  primaryButtonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  discardButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    borderTopWidth: 1,
    borderTopColor: '#7F1D1D',
    borderWidth: 1,
    borderColor: '#7F1D1D',
    backgroundColor: 'rgba(127, 29, 29, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardButtonLabel: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: '700',
  },
  sheetInput: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: '#0B0B0B',
    color: '#FFFFFF',
    fontSize: 15,
    paddingHorizontal: 14,
  },
  timerPickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerColumn: {
    flex: 1,
    gap: 6,
  },
  pickerTitle: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  pickerValueButton: {
    minHeight: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: '#0B0B0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerValueButtonActive: {
    borderColor: '#0A84FF',
    backgroundColor: 'rgba(10, 132, 255, 0.14)',
  },
  pickerValueText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '700',
  },
  pickerValueTextActive: {
    color: '#FFFFFF',
  },
  filterSection: {
    gap: 8,
  },
  filterLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    minHeight: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: '#0B0B0B',
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    borderColor: '#0A84FF',
    backgroundColor: 'rgba(10, 132, 255, 0.14)',
  },
  filterChipText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
  },
  exerciseListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: '#0B0B0B',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  exerciseListThumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111111',
  },
  exerciseListCopy: {
    flex: 1,
    gap: 2,
  },
  exerciseListName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseListMeta: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  emptyLibraryText: {
    color: '#9CA3AF',
    textAlign: 'center',
    fontSize: 13,
    marginTop: 8,
  },
  detailTabsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  detailTabButton: {
    minHeight: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: '#0B0B0B',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTabButtonActive: {
    borderColor: '#0A84FF',
    backgroundColor: 'rgba(10, 132, 255, 0.14)',
  },
  detailTabLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  detailTabLabelActive: {
    color: '#FFFFFF',
  },
  detailSection: {
    gap: 10,
  },
  detailImagePlaceholder: {
    width: '100%',
    height: 150,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: '#0B0B0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailSectionTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  muscleChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleChip: {
    minHeight: 30,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: '#0B0B0B',
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muscleChipText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  prGraph: {
    height: 124,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: '#0B0B0B',
    paddingHorizontal: 10,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  prBarCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  prBar: {
    width: '100%',
    borderRadius: 999,
    backgroundColor: '#0A84FF',
  },
  prBarLabel: {
    color: '#9CA3AF',
    fontSize: 10,
  },
  historyRow: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: '#0B0B0B',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyDate: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  historyValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  howToItem: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 19,
  },
  leaderboardRow: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: '#0B0B0B',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leaderboardRank: {
    color: '#0A84FF',
    fontSize: 14,
    fontWeight: '700',
    width: 32,
  },
  leaderboardName: {
    color: '#FFFFFF',
    fontSize: 13,
    flex: 1,
  },
  leaderboardValue: {
    color: '#9CA3AF',
    fontSize: 12,
  },
});

export default WorkoutScreen;
