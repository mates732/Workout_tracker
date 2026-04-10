import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
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
import { colors, radius, spacing, typography } from '../../shared/theme/tokens';

// ─── Built-in exercise library (no external API — works offline & on web) ────

type BuiltInExercise = {
  id: number;
  name: string;
  muscle_group: string;
  equipment: string;
};

const BUILT_IN_EXERCISES: BuiltInExercise[] = [
  // Chest
  { id: 1, name: 'Bench Press', muscle_group: 'Chest', equipment: 'Barbell' },
  { id: 2, name: 'Incline Bench Press', muscle_group: 'Chest', equipment: 'Barbell' },
  { id: 3, name: 'Decline Bench Press', muscle_group: 'Chest', equipment: 'Barbell' },
  { id: 4, name: 'Dumbbell Fly', muscle_group: 'Chest', equipment: 'Dumbbell' },
  { id: 5, name: 'Cable Fly', muscle_group: 'Chest', equipment: 'Cable' },
  { id: 6, name: 'Push-Up', muscle_group: 'Chest', equipment: 'Bodyweight' },
  { id: 7, name: 'Dip', muscle_group: 'Chest', equipment: 'Bodyweight' },
  { id: 8, name: 'Pec Deck', muscle_group: 'Chest', equipment: 'Machine' },
  // Back
  { id: 9, name: 'Deadlift', muscle_group: 'Back', equipment: 'Barbell' },
  { id: 10, name: 'Deadlift (Trap Bar)', muscle_group: 'Back', equipment: 'Barbell' },
  { id: 11, name: 'Romanian Deadlift', muscle_group: 'Back', equipment: 'Barbell' },
  { id: 12, name: 'Barbell Row', muscle_group: 'Back', equipment: 'Barbell' },
  { id: 13, name: 'Cable Row', muscle_group: 'Back', equipment: 'Cable' },
  { id: 14, name: 'Lat Pulldown', muscle_group: 'Back', equipment: 'Cable' },
  { id: 15, name: 'Pull-Up', muscle_group: 'Back', equipment: 'Bodyweight' },
  { id: 16, name: 'Chin-Up', muscle_group: 'Back', equipment: 'Bodyweight' },
  { id: 17, name: 'T-Bar Row', muscle_group: 'Back', equipment: 'Barbell' },
  { id: 18, name: 'Dumbbell Row', muscle_group: 'Back', equipment: 'Dumbbell' },
  { id: 19, name: 'Face Pull', muscle_group: 'Back', equipment: 'Cable' },
  // Legs
  { id: 20, name: 'Back Squat', muscle_group: 'Legs', equipment: 'Barbell' },
  { id: 21, name: 'Front Squat', muscle_group: 'Legs', equipment: 'Barbell' },
  { id: 22, name: 'Leg Press', muscle_group: 'Legs', equipment: 'Machine' },
  { id: 23, name: 'Bulgarian Split Squat', muscle_group: 'Legs', equipment: 'Dumbbell' },
  { id: 24, name: 'Lunge', muscle_group: 'Legs', equipment: 'Dumbbell' },
  { id: 25, name: 'Hip Thrust', muscle_group: 'Legs', equipment: 'Barbell' },
  { id: 26, name: 'Leg Curl', muscle_group: 'Legs', equipment: 'Machine' },
  { id: 27, name: 'Leg Extension', muscle_group: 'Legs', equipment: 'Machine' },
  { id: 28, name: 'Calf Raise', muscle_group: 'Legs', equipment: 'Machine' },
  { id: 29, name: 'Nordic Hamstring Curl', muscle_group: 'Legs', equipment: 'Bodyweight' },
  // Shoulders
  { id: 30, name: 'Overhead Press', muscle_group: 'Shoulders', equipment: 'Barbell' },
  { id: 31, name: 'Dumbbell Shoulder Press', muscle_group: 'Shoulders', equipment: 'Dumbbell' },
  { id: 32, name: 'Lateral Raise', muscle_group: 'Shoulders', equipment: 'Dumbbell' },
  { id: 33, name: 'Front Raise', muscle_group: 'Shoulders', equipment: 'Dumbbell' },
  { id: 34, name: 'Rear Delt Fly', muscle_group: 'Shoulders', equipment: 'Dumbbell' },
  { id: 35, name: 'Arnold Press', muscle_group: 'Shoulders', equipment: 'Dumbbell' },
  { id: 36, name: 'Upright Row', muscle_group: 'Shoulders', equipment: 'Barbell' },
  // Arms
  { id: 37, name: 'Dumbbell Curl', muscle_group: 'Arms', equipment: 'Dumbbell' },
  { id: 38, name: 'Barbell Curl', muscle_group: 'Arms', equipment: 'Barbell' },
  { id: 39, name: 'Hammer Curl', muscle_group: 'Arms', equipment: 'Dumbbell' },
  { id: 40, name: 'Preacher Curl', muscle_group: 'Arms', equipment: 'Barbell' },
  { id: 41, name: 'Tricep Pushdown', muscle_group: 'Arms', equipment: 'Cable' },
  { id: 42, name: 'Tricep Overhead Extension', muscle_group: 'Arms', equipment: 'Dumbbell' },
  { id: 43, name: 'Skull Crusher', muscle_group: 'Arms', equipment: 'Barbell' },
  { id: 44, name: 'Close-Grip Bench Press', muscle_group: 'Arms', equipment: 'Barbell' },
  // Core
  { id: 45, name: 'Plank', muscle_group: 'Core', equipment: 'Bodyweight' },
  { id: 46, name: 'Ab Wheel Rollout', muscle_group: 'Core', equipment: 'Bodyweight' },
  { id: 47, name: 'Cable Crunch', muscle_group: 'Core', equipment: 'Cable' },
  { id: 48, name: 'Hanging Leg Raise', muscle_group: 'Core', equipment: 'Bodyweight' },
  { id: 49, name: 'Russian Twist', muscle_group: 'Core', equipment: 'Bodyweight' },
  { id: 50, name: 'Pallof Press', muscle_group: 'Core', equipment: 'Cable' },
];

const CATEGORIES = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'] as const;
type Category = (typeof CATEGORIES)[number];

export function AddExerciseScreen() {
  const navigation = useNavigation();
  const { addExerciseToActiveWorkout } = useWorkoutFlow();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const [submitting, setSubmitting] = useState(false);
  const [selectedById, setSelectedById] = useState<Record<number, BuiltInExercise>>({});
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, []);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BUILT_IN_EXERCISES.filter((item) => {
      const matchesCategory = category === 'All' || item.muscle_group === category;
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.muscle_group.toLowerCase().includes(q) ||
        item.equipment.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  const selectedItems = useMemo(() => Object.values(selectedById), [selectedById]);

  const toggleSelect = (item: BuiltInExercise) => {
    Vibration.vibrate(6);
    setSelectedById((current) => {
      const next = { ...current };
      if (next[item.id]) {
        delete next[item.id];
      } else {
        next[item.id] = item;
      }
      return next;
    });
  };

  const confirmSelection = async () => {
    if (!selectedItems.length) {
      if (navigation.canGoBack()) navigation.goBack();
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
          // Continue adding remaining exercises.
        }
      }
    } finally {
      setSubmitting(false);
      if (navigation.canGoBack()) navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.topRow}>
          <Text style={styles.title}>Exercise Library</Text>
          <Pressable onPress={() => navigation.canGoBack() && navigation.goBack()}>
            <Text style={styles.close}>Close</Text>
          </Pressable>
        </View>

        {/* Search */}
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercises"
          placeholderTextColor={colors.mutedText}
          style={styles.input}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />

        {/* Category chips — MUST have flexDirection: 'row' for web */}
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
                <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Exercise list */}
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const selected = Boolean(selectedById[item.id]);
            return (
              <Pressable
                style={[styles.row, selected && styles.rowSelected]}
                onPress={() => toggleSelect(item)}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(item.muscle_group) }]} />
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{item.name}</Text>
                    <Text style={styles.rowMeta}>{`${item.muscle_group} · ${item.equipment}`}</Text>
                  </View>
                </View>
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </Pressable>
            );
          }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No exercises found.</Text>
            </View>
          )}
        />

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text style={styles.selectionText}>
              {selectedItems.length > 0 ? `${selectedItems.length} selected` : 'Tap to select exercises'}
            </Text>
          </View>
          <AppButton onPress={confirmSelection} disabled={submitting}>
            {submitting ? 'Adding…' : selectedItems.length > 0 ? `Add ${selectedItems.length} Exercise${selectedItems.length > 1 ? 's' : ''}` : 'Done'}
          </AppButton>
        </View>
      </View>
    </SafeAreaView>
  );
}

function getCategoryColor(muscle_group: string): string {
  switch (muscle_group) {
    case 'Chest': return colors.splitChest;
    case 'Back': return colors.splitBack;
    case 'Legs': return colors.splitLegs;
    case 'Shoulders': return '#FF9F0A';
    case 'Arms': return colors.splitArms;
    case 'Core': return '#BF5AF2';
    default: return colors.mutedText;
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
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
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '600',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  // ── FIX: flexDirection: 'row' required for web horizontal scrollview ─────────
  categoryRow: {
    flexDirection: 'row',        // ← This was missing, causing vertical stacking
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  categoryChip: {
    height: 34,
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
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 130,
    gap: spacing.xs,
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(10,132,255,0.10)',
  },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  rowCopy: { flex: 1 },
  rowTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  rowMeta: {
    color: colors.mutedText,
    fontSize: typography.tiny,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: colors.primaryText,
    fontSize: 13,
    fontWeight: '800',
  },
  emptyWrap: {
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  footer: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.lg,
    gap: spacing.xs,
    backgroundColor: colors.background,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectionText: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: '600',
  },
});

export default AddExerciseScreen;
