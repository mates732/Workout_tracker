import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { fetchAllExercises } from '../../shared/api/exerciseDbApi';
import { loadTrackerSnapshot, saveTrackerSnapshot } from '../../shared/state/workoutTrackerStore';
import { useWorkoutContext } from './state/workoutContext';

type ExerciseItem = {
  id: number;
  name: string;
  muscle_group: string;
  equipment: string;
  image?: string;
};

type RouteParams = {
  autoOpenLogger?: boolean;
};

function toNumericId(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash) || Date.now();
}

export function AddExerciseScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const autoOpenLogger = Boolean((route.params as RouteParams | undefined)?.autoOpenLogger);
  const { addExerciseToWorkout } = useWorkoutContext();

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [allExercises, setAllExercises] = useState<ExerciseItem[]>([]);
  const [favoriteExerciseIds, setFavoriteExerciseIds] = useState<number[]>([]);
  const [recentExerciseIds, setRecentExerciseIds] = useState<number[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<number[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;

    void Promise.all([fetchAllExercises(), loadTrackerSnapshot()])
      .then(([exerciseData, trackerSnapshot]) => {
        if (!mounted) {
          return;
        }

        if (Array.isArray(exerciseData)) {
          const mapped = exerciseData
            .map((item) => ({
              id: toNumericId(String(item.id ?? item.name ?? Date.now())),
              name: String(item.name ?? 'Exercise'),
              muscle_group: String(item.target ?? item.bodyPart ?? 'general'),
              equipment: String(item.equipment ?? 'mixed'),
              image: typeof item.gifUrl === 'string' ? item.gifUrl : undefined,
            }))
            .slice(0, 1500);
          setAllExercises(mapped);
        }

        setFavoriteExerciseIds(trackerSnapshot.favorites ?? []);
        setRecentExerciseIds(trackerSnapshot.recentExerciseIds ?? []);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  const filteredResults = useMemo(() => {
    if (!allExercises.length) {
      return [] as ExerciseItem[];
    }

    const normalizedQuery = query.trim().toLowerCase();
    const normalizedType = typeFilter.trim().toLowerCase();
    const normalizedEquipment = equipmentFilter.trim().toLowerCase();
    const normalizedTarget = targetFilter.trim().toLowerCase();

    return allExercises
      .filter((item) => {
        const name = item.name.toLowerCase();
        const muscle = item.muscle_group.toLowerCase();
        const equipment = item.equipment.toLowerCase();

        const queryMatch =
          !normalizedQuery ||
          name.includes(normalizedQuery) ||
          muscle.includes(normalizedQuery) ||
          equipment.includes(normalizedQuery);

        const typeMatch = !normalizedType || muscle.includes(normalizedType);
        const equipmentMatch = !normalizedEquipment || equipment.includes(normalizedEquipment);
        const targetMatch = !normalizedTarget || muscle.includes(normalizedTarget);

        return queryMatch && typeMatch && equipmentMatch && targetMatch;
      })
      .slice(0, 40);
  }, [allExercises, equipmentFilter, query, targetFilter, typeFilter]);

  const recentItems = useMemo(() => {
    const byId = new Map(filteredResults.map((item) => [item.id, item]));
    return recentExerciseIds
      .map((id) => byId.get(id))
      .filter((item): item is ExerciseItem => Boolean(item))
      .slice(0, 6);
  }, [filteredResults, recentExerciseIds]);

  const favoriteItems = useMemo(() => {
    if (!filteredResults.length) {
      return [] as ExerciseItem[];
    }
    return filteredResults.filter((item) => favoriteExerciseIds.includes(item.id)).slice(0, 8);
  }, [favoriteExerciseIds, filteredResults]);

  const persistFavoritesAndRecents = async (nextFavorites: number[], nextRecents: number[]) => {
    const snapshot = await loadTrackerSnapshot();
    await saveTrackerSnapshot({
      ...snapshot,
      favorites: nextFavorites,
      recentExerciseIds: nextRecents,
    });
  };

  const toggleFavoriteExercise = (exerciseId: number) => {
    setFavoriteExerciseIds((current) => {
      const exists = current.includes(exerciseId);
      const next = exists ? current.filter((item) => item !== exerciseId) : [exerciseId, ...current].slice(0, 50);
      void persistFavoritesAndRecents(next, recentExerciseIds).catch(() => undefined);
      return next;
    });
  };

  const toggleSelect = (exerciseId: number) => {
    setSelectedExercises((current) => {
      const exists = current.includes(exerciseId);
      return exists ? current.filter((id) => id !== exerciseId) : [exerciseId, ...current];
    });
  };

  const markRecentExercise = (exerciseId: number) => {
    setRecentExerciseIds((current) => {
      const deduped = [exerciseId, ...current.filter((item) => item !== exerciseId)].slice(0, 25);
      void persistFavoritesAndRecents(favoriteExerciseIds, deduped).catch(() => undefined);
      return deduped;
    });
  };

  const addExercise = async (
    payload: { exercise_id?: number; exercise_name?: string },
    shouldCloseAfterSelect = !autoOpenLogger
  ) => {
    const resolvedName = payload.exercise_name?.trim() || filteredResults.find((item) => item.id === payload.exercise_id)?.name;
    if (!resolvedName) {
      return;
    }

    addExerciseToWorkout({ id: payload.exercise_id ? String(payload.exercise_id) : undefined, name: resolvedName });
    if (payload.exercise_id) {
      markRecentExercise(payload.exercise_id);
    }


    if (shouldCloseAfterSelect && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const onDone = () => {
    if (customExerciseName.trim()) {
      void addExercise({ exercise_name: customExerciseName.trim() }, false).then(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      });
      return;
    }

    if (selectedExercises.length > 0) {
      (async () => {
        for (const id of selectedExercises) {
          // add without closing on each add
          // eslint-disable-next-line no-await-in-loop
          await addExercise({ exercise_id: id }, false);
        }
        if (navigation.canGoBack()) navigation.goBack();
      })();
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => undefined, 120);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, typeFilter, equipmentFilter, targetFilter]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <View style={styles.topRow}>
            <Text style={styles.title}>LIBRARY</Text>
            <Pressable onPress={() => navigation.canGoBack() && navigation.goBack()}>
              <Text style={styles.close}>FINISH</Text>
            </Pressable>
          </View>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search exercise"
            placeholderTextColor="#767676"
            style={styles.searchInput}
            autoFocus
            returnKeyType="search"
          />

          <View style={styles.filtersRow}>
            <TextInput
              value={typeFilter}
              onChangeText={setTypeFilter}
              placeholder="Type (body part)"
              placeholderTextColor="#767676"
              style={[styles.searchInput, styles.filterInput]}
            />
            <TextInput
              value={equipmentFilter}
              onChangeText={setEquipmentFilter}
              placeholder="Accessories"
              placeholderTextColor="#767676"
              style={[styles.searchInput, styles.filterInput]}
            />
          </View>

          <TextInput
            value={targetFilter}
            onChangeText={setTargetFilter}
            placeholder="Target muscle"
            placeholderTextColor="#767676"
            style={styles.searchInput}
          />

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {recentItems.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Recent</Text>
                {recentItems.map((item) => (
                  <Pressable
                    key={`recent-${item.id}`}
                        style={[styles.rowCard, selectedExercises.includes(item.id) ? styles.rowSelected : null]}
                        onPress={() => {
                          toggleSelect(item.id);
                        }}
                  >
                        <View style={styles.rowMainInner}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.rowText, selectedExercises.includes(item.id) ? styles.selectedText : null]}>{item.name}</Text>
                            <Text style={[styles.rowMeta, selectedExercises.includes(item.id) ? styles.selectedMeta : null]}>{item.muscle_group} • {item.equipment}</Text>
                          </View>
                          {selectedExercises.includes(item.id) ? <Text style={styles.checkmark}>✓</Text> : null}
                        </View>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {favoriteItems.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Favorites</Text>
                {favoriteItems.map((item) => (
                  <View key={`fav-${item.id}`} style={[styles.rowBetweenCard, selectedExercises.includes(item.id) ? styles.rowSelected : null]}>
                    <Pressable
                      style={[styles.rowMain, styles.rowMainSelectable]}
                      onPress={() => {
                        toggleSelect(item.id);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.rowText, selectedExercises.includes(item.id) ? styles.selectedText : null]}>{item.name}</Text>
                        <Text style={[styles.rowMeta, selectedExercises.includes(item.id) ? styles.selectedMeta : null]}>{item.muscle_group} • {item.equipment}</Text>
                      </View>
                      {selectedExercises.includes(item.id) ? <Text style={styles.checkmark}>✓</Text> : null}
                    </Pressable>
                    <Pressable onPress={() => toggleFavoriteExercise(item.id)}>
                      <Text style={styles.metaAction}>{favoriteExerciseIds.includes(item.id) ? 'SAVED' : 'SAVE'}</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Results</Text>
              {filteredResults.map((item) => (
                <View key={item.id} style={[styles.rowBetweenCard, selectedExercises.includes(item.id) ? styles.rowSelected : null]}>
                  <Pressable
                    style={[styles.rowMain, styles.rowMainSelectable]}
                    onPress={() => {
                      toggleSelect(item.id);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowText, selectedExercises.includes(item.id) ? styles.selectedText : null]}>{item.name}</Text>
                      <Text style={[styles.rowMeta, selectedExercises.includes(item.id) ? styles.selectedMeta : null]}>{item.muscle_group} • {item.equipment}</Text>
                    </View>
                    {selectedExercises.includes(item.id) ? <Text style={styles.checkmark}>✓</Text> : null}
                  </Pressable>
                  <Pressable onPress={() => toggleFavoriteExercise(item.id)}>
                    <Text style={styles.metaAction}>{favoriteExerciseIds.includes(item.id) ? 'SAVED' : 'SAVE'}</Text>
                  </Pressable>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Custom</Text>
              <TextInput
                value={customExerciseName}
                onChangeText={setCustomExerciseName}
                placeholder="Custom exercise name"
                placeholderTextColor="#767676"
                style={styles.searchInput}
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (!customExerciseName.trim()) {
                    return;
                  }
                  void addExercise({ exercise_name: customExerciseName.trim() }, !autoOpenLogger);
                }}
              />
            </View>
          </ScrollView>

          <Pressable
            style={styles.bottomButton}
            onPress={onDone}
          >
            <Text style={styles.bottomButtonText}>
              {autoOpenLogger ? `Done${selectedExercises.length > 0 ? ` (${selectedExercises.length})` : ''}` : 'Done'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 18,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
  },
  close: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  searchInput: {
    minHeight: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2B2B2B',
    backgroundColor: '#1B1B1B',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 13,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  filterInput: {
    flex: 1,
  },
  content: {
    paddingTop: 12,
    paddingBottom: 120,
    gap: 18,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    color: '#7E7E7E',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  rowCard: {
    minHeight: 52,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 10,
    backgroundColor: '#1F1F1F',
    paddingHorizontal: 12,
  },
  rowMainInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowSelected: { backgroundColor: '#1FAF3A', borderColor: '#158B2B' },
  rowMainSelectable: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectedText: { color: '#000000' },
  selectedMeta: { color: '#0F2A0F' },
  checkmark: { color: '#000000', fontSize: 18, fontWeight: '900', marginLeft: 12 },
  rowBetweenCard: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 10,
    backgroundColor: '#1F1F1F',
    paddingHorizontal: 12,
  },
  rowMain: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  rowText: {
    color: '#F3F3F3',
    fontSize: 15,
    fontWeight: '700',
  },
  rowMeta: {
    color: '#9A9A9A',
    fontSize: 11,
    marginTop: 2,
  },
  metaAction: {
    color: '#C6C6C6',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  bottomButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 18,
    minHeight: 54,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomButtonText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});