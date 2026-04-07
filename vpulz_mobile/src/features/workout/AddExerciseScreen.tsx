import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../shared/components/ui';
import { useWorkoutFlow } from '../../shared/state/WorkoutFlowContext';
import { searchInternetExerciseLibrary } from '../../shared/api/exerciseLibraryApi';
import type { ExerciseItem } from '../../shared/api/workoutApi';
import { colors, radius, spacing, typography } from '../../shared/theme/tokens';

const CATEGORIES = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'] as const;

const SAMPLE_FALLBACK: ExerciseItem[] = [
  {
    id: 1000001,
    name: 'Back Squat',
    muscle_group: 'Legs',
    equipment: 'Barbell',
    instructions: '',
    image_url: null,
    image_urls: [],
    video_url: null,
    video_urls: [],
    source: 'internet',
  },
  {
    id: 1000002,
    name: 'Bench Press',
    muscle_group: 'Chest',
    equipment: 'Barbell',
    instructions: '',
    image_url: null,
    image_urls: [],
    video_url: null,
    video_urls: [],
    source: 'internet',
  },
  {
    id: 1000003,
    name: 'Romanian Deadlift',
    muscle_group: 'Back',
    equipment: 'Barbell',
    instructions: '',
    image_url: null,
    image_urls: [],
    video_url: null,
    video_urls: [],
    source: 'internet',
  },
  {
    id: 1000004,
    name: 'Overhead Press',
    muscle_group: 'Shoulders',
    equipment: 'Barbell',
    instructions: '',
    image_url: null,
    image_urls: [],
    video_url: null,
    video_urls: [],
    source: 'internet',
  },
  {
    id: 1000005,
    name: 'Pull-up',
    muscle_group: 'Back',
    equipment: 'Bodyweight',
    instructions: '',
    image_url: null,
    image_urls: [],
    video_url: null,
    video_urls: [],
    source: 'internet',
  },
];

function normalizeCategory(category: string): string | undefined {
  if (category === 'All') {
    return undefined;
  }

  return category.toLowerCase();
}

export function AddExerciseScreen() {
  const navigation = useNavigation();
  const { addExerciseToActiveWorkout } = useWorkoutFlow();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All');
  const [items, setItems] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedById, setSelectedById] = useState<Record<number, ExerciseItem>>({});

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedItems = useMemo(() => Object.values(selectedById), [selectedById]);

  const loadResults = async (nextQuery: string, nextCategory: string) => {
    setLoading(true);
    setError(null);

    try {
      const results = await searchInternetExerciseLibrary(nextQuery, normalizeCategory(nextCategory), 80);
      setItems(results);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load exercise library';
      setError(message);
      setItems(SAMPLE_FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadResults('', category);

    return () => {
      if (debounce.current) {
        clearTimeout(debounce.current);
      }
    };
  }, []);

  useEffect(() => {
    if (debounce.current) {
      clearTimeout(debounce.current);
    }

    debounce.current = setTimeout(() => {
      void loadResults(query, category);
    }, 220);

    return () => {
      if (debounce.current) {
        clearTimeout(debounce.current);
      }
    };
  }, [query, category]);

  const toggleSelect = (item: ExerciseItem) => {
    Vibration.vibrate(6);
    setSelectedById((current) => {
      const next = { ...current };
      if (next[item.id]) {
        delete next[item.id];
        return next;
      }

      next[item.id] = item;
      return next;
    });
  };

  const confirmSelection = async () => {
    if (!selectedItems.length) {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
      return;
    }

    setSubmitting(true);
    try {
      for (const item of selectedItems) {
        try {
          await addExerciseToActiveWorkout({
            exercise_id: item.id,
            exercise_name: item.name,
            muscle_group: item.muscle_group,
            equipment: item.equipment,
          });
        } catch {
          // Continue adding remaining selected exercises.
        }
      }
    } finally {
      setSubmitting(false);
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    }
  };

  const keyExtractor = (item: ExerciseItem) => String(item.id);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Exercise Library</Text>
          <Pressable onPress={() => navigation.canGoBack() && navigation.goBack()}>
            <Text style={styles.close}>Close</Text>
          </Pressable>
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercises"
          placeholderTextColor={colors.mutedText}
          style={styles.input}
          returnKeyType="search"
        />

        <ScrollView
          horizontal
          contentContainerStyle={styles.categoryRow}
          showsHorizontalScrollIndicator={false}
        >
          {CATEGORIES.map((item) => {
            const selected = category === item;
            return (
              <Pressable
                key={item}
                style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                onPress={() => setCategory(item)}
              >
                <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>{item}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={keyExtractor}
            renderItem={({ item }) => {
              const selected = Boolean(selectedById[item.id]);
              return (
                <Pressable
                  style={[styles.row, selected && styles.rowSelected]}
                  onPress={() => toggleSelect(item)}
                >
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{item.name}</Text>
                    <Text style={styles.rowMeta}>{`${item.muscle_group} • ${item.equipment}`}</Text>
                  </View>
                  <Text style={[styles.rowStatus, selected && styles.rowStatusSelected]}>
                    {selected ? 'Selected' : 'Select'}
                  </Text>
                </Pressable>
              );
            }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => (
              <View style={styles.stateWrap}>
                <Text style={styles.emptyText}>No exercises found.</Text>
              </View>
            )}
          />
        )}

        {error ? <Text style={styles.errorText}>{`Library fallback active: ${error}`}</Text> : null}

        <View style={styles.footer}>
          <Text style={styles.selectionText}>{`${selectedItems.length} selected`}</Text>
          <AppButton onPress={confirmSelection} disabled={submitting || loading}>
            {submitting ? 'Adding...' : `Add Selected${selectedItems.length ? ` (${selectedItems.length})` : ''}`}
          </AppButton>
        </View>
      </View>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
  },
  close: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '600',
    paddingHorizontal: spacing.sm,
  },
  categoryRow: {
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  categoryChipSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(10,132,255,0.16)',
  },
  categoryChipText: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  categoryChipTextSelected: {
    color: colors.primary,
  },
  listContent: {
    paddingBottom: 120,
  },
  row: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(10,132,255,0.12)',
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  rowMeta: {
    color: colors.mutedText,
    fontSize: typography.tiny,
    marginTop: spacing.xs,
  },
  rowStatus: {
    color: colors.mutedText,
    fontSize: typography.tiny,
    fontWeight: '700',
  },
  rowStatusSelected: {
    color: colors.primary,
  },
  stateWrap: {
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  errorText: {
    color: '#D7B9B5',
    fontSize: typography.tiny,
    marginBottom: spacing.xs,
  },
  footer: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.background,
    paddingTop: spacing.sm,
  },
  selectionText: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: '600',
  },
});

export default AddExerciseScreen;
