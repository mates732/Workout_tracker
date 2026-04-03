import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, View, Text, TextInput, Pressable, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useWorkoutFlow } from '../../shared/state/WorkoutFlowContext';
import { searchInternetExerciseLibrary } from '../../shared/api/exerciseLibraryApi';
import type { ExerciseItem } from '../../shared/api/workoutApi';
import { colors, typography } from '../../shared/theme/tokens';

type RouteParams = {
  autoOpenLogger?: boolean;
};

export function AddExerciseScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const autoOpenLogger = Boolean((route.params as RouteParams | undefined)?.autoOpenLogger);
  const { addExerciseToActiveWorkout } = useWorkoutFlow();

  const [query, setQuery] = useState('');
  const [items, setItems] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadResults = async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const results = await searchInternetExerciseLibrary(q, undefined, 60);
      setItems(results);
    } catch (e: unknown) {
      // surface a helpful message and clear the results
      const msg = e instanceof Error ? e.message : 'Failed to load exercise library';
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load
    void loadResults('');
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, []);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      void loadResults(query);
    }, 220);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query]);

  const onAddDirect = async (item: ExerciseItem) => {
    try {
      await addExerciseToActiveWorkout({ exercise_id: item.id, exercise_name: item.name });
    } catch {
      // ignore
    }
    if (!autoOpenLogger && navigation.canGoBack()) navigation.goBack();
  };

  const renderItem = ({ item }: { item: ExerciseItem }) => (
    <Pressable style={styles.row} onPress={() => onAddDirect(item)}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{item.name}</Text>
        <Text style={styles.rowMeta}>{item.muscle_group} • {item.equipment}</Text>
      </View>
      <Text style={styles.addHint}>Add</Text>
    </Pressable>
  );

  const keyExtractor = (i: ExerciseItem) => String(i.id);

  return (
    <SafeAreaView style={styles.safeArea}>
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
          style={styles.input}
          returnKeyType="search"
        />

        {loading ? (
          <View style={{ marginTop: 24 }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <Text style={{ color: '#D0A0A0', marginBottom: 12 }}>{`Error: ${error}`}</Text>
            <Pressable style={[styles.row, { alignItems: 'center', justifyContent: 'center' }]} onPress={() => loadResults(query)}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Retry</Text>
            </Pressable>
            <Pressable
              style={[styles.row, { alignItems: 'center', justifyContent: 'center', marginTop: 10 }]}
              onPress={() => {
                // lightweight local fallback list
                const fallback: ExerciseItem[] = [
                  { id: 1000001, name: 'Back Squat', muscle_group: 'Legs', equipment: 'Barbell', instructions: '', image_url: null, image_urls: [], video_url: null, video_urls: [], source: 'internet' },
                  { id: 1000002, name: 'Bench Press', muscle_group: 'Chest', equipment: 'Barbell', instructions: '', image_url: null, image_urls: [], video_url: null, video_urls: [], source: 'internet' },
                  { id: 1000003, name: 'Deadlift', muscle_group: 'Back', equipment: 'Barbell', instructions: '', image_url: null, image_urls: [], video_url: null, video_urls: [], source: 'internet' },
                  { id: 1000004, name: 'Overhead Press', muscle_group: 'Shoulders', equipment: 'Barbell', instructions: '', image_url: null, image_urls: [], video_url: null, video_urls: [], source: 'internet' },
                  { id: 1000005, name: 'Pull-up', muscle_group: 'Back', equipment: 'Bodyweight', instructions: '', image_url: null, image_urls: [], video_url: null, video_urls: [], source: 'internet' },
                ];
                setItems(fallback);
                setError(null);
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Use sample exercises</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={() => (
              <View style={styles.empty}><Text style={styles.emptyText}>No exercises found</Text></View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '800' },
  close: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  input: {
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2B2B2B',
    backgroundColor: '#1B1B1B',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 12,
  },
  listContent: { paddingVertical: 12, paddingBottom: 120 },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 10,
    backgroundColor: '#1F1F1F',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  rowTitle: { color: '#F3F3F3', fontSize: 15, fontWeight: '700' },
  rowMeta: { color: '#9A9A9A', fontSize: 11, marginTop: 2 },
  addHint: { color: colors.primary, fontWeight: '800' },
  empty: { paddingTop: 40, alignItems: 'center' },
  emptyText: { color: '#9A9A9A' },
});

export default AddExerciseScreen;
