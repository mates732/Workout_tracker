import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { AppButton, AppCard, AppChip } from '../../shared/components/ui';
import { useWorkoutFlow } from '../../shared/state/WorkoutFlowContext';
import { colors, radius, spacing, typography } from '../../shared/theme/tokens';
import { CalendarComponent } from './components/CalendarComponent';

type CalendarNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type EntrySource = 'planned' | 'completed';

type DayExercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  note?: string;
};

type DayEntry = {
  id: string;
  date: string;
  source: EntrySource;
  split: string;
  title: string;
  summary: string;
  exercises: DayExercise[];
  plannedIndex: number | null;
};

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function toDateKey(value: string): string {
  const dateOnlyMatch = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    return `${dateOnlyMatch[1]}-${dateOnlyMatch[2]}-${dateOnlyMatch[3]}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateKey(value: string): Date {
  const dateOnlyMatch = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = Number.parseInt(dateOnlyMatch[1], 10);
    const month = Number.parseInt(dateOnlyMatch[2], 10);
    const day = Number.parseInt(dateOnlyMatch[3], 10);
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
}

function formatDisplayDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  if (Number.isNaN(date.getTime())) {
    return dateKey;
  }

  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function normalizeSplit(value: string): string {
  return value.trim().toLowerCase();
}

function formatSplit(value: string): string {
  if (!value.trim()) {
    return 'General';
  }
  return value
    .replace(/_/g, ' ')
    .split(' ')
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(' ');
}

export function CalendarScreen() {
  const navigation = useNavigation<CalendarNavigationProp>();
  const {
    selectedDate,
    setSelectedDate,
    plannedWorkouts,
    workoutHistory,
    startPlannedWorkout,
  } = useWorkoutFlow();

  const [sourceFilter, setSourceFilter] = useState<'all' | EntrySource>('all');
  const [splitFilter, setSplitFilter] = useState<string>('all');
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [exerciseDetail, setExerciseDetail] = useState<DayExercise | null>(null);

  const entries = useMemo<DayEntry[]>(() => {
    const planned: DayEntry[] = plannedWorkouts.map((item, index) => ({
      id: `planned-${item.date}-${item.preview.id}-${index}`,
      date: item.date,
      source: 'planned',
      split: item.preview.splitKey,
      title: item.preview.title,
      summary: item.preview.summary,
      plannedIndex: index,
      exercises: item.preview.exercises.map((exercise, exerciseIndex) => ({
        id: `planned-ex-${item.preview.id}-${exerciseIndex}`,
        name: exercise.name,
        sets: exercise.targetSets,
        reps: exercise.targetReps,
        weight: exercise.targetWeightKg,
        note: exercise.coachCue,
      })),
    }));

    const completed: DayEntry[] = workoutHistory.map((item) => ({
      id: `completed-${item.id}-${item.completedAt}`,
      date: toDateKey(item.completedAt),
      source: 'completed',
      split: item.splitKey,
      title: item.splitKey ? `${formatSplit(item.splitKey)} Session` : 'Completed Workout',
      summary: item.summaryLine,
      plannedIndex: null,
      exercises: item.exercises.map((exercise, exerciseIndex) => ({
        id: `completed-ex-${item.id}-${exerciseIndex}`,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.topReps,
        weight: exercise.topWeight,
      })),
    }));

    return [...planned, ...completed].sort((left, right) => right.date.localeCompare(left.date));
  }, [plannedWorkouts, workoutHistory]);

  const splitOptions = useMemo(() => {
    const values = Array.from(new Set(entries.map((entry) => normalizeSplit(entry.split)).filter(Boolean)));
    return ['all', ...values];
  }, [entries]);

  const workoutDates = useMemo(() => Array.from(new Set(entries.map((entry) => entry.date))), [entries]);

  const selectedDateEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (entry.date !== selectedDate) {
        return false;
      }

      if (sourceFilter !== 'all' && entry.source !== sourceFilter) {
        return false;
      }

      if (splitFilter !== 'all' && normalizeSplit(entry.split) !== splitFilter) {
        return false;
      }

      if (!exerciseQuery.trim()) {
        return true;
      }

      const q = exerciseQuery.trim().toLowerCase();
      return (
        entry.title.toLowerCase().includes(q) ||
        entry.exercises.some((exercise) => exercise.name.toLowerCase().includes(q))
      );
    });
  }, [entries, exerciseQuery, selectedDate, sourceFilter, splitFilter]);

  const startFromPlan = (entry: DayEntry) => {
    if (entry.source !== 'planned' || entry.plannedIndex == null) {
      return;
    }

    const planned = plannedWorkouts[entry.plannedIndex];
    if (!planned) {
      return;
    }

    startPlannedWorkout(planned);
    navigation.navigate('ActiveWorkout');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Calendar</Text>
          <Text style={styles.subtitle}>Browse planned routines and completed sessions with quick filters.</Text>
        </View>

        <AppCard style={styles.calendarCard}>
          <View style={styles.calendarHeaderRow}>
            <Text style={styles.sectionTitle}>Calendar Preview</Text>
            <Text style={styles.sectionMeta}>{formatDisplayDate(selectedDate)}</Text>
          </View>
          <CalendarComponent
            selectedDate={selectedDate}
            workoutDates={workoutDates}
            onSelectDate={setSelectedDate}
            weeksToRender={11}
          />
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Filters</Text>
          <TextInput
            value={exerciseQuery}
            onChangeText={setExerciseQuery}
            placeholder="Filter by exercise or routine"
            placeholderTextColor={colors.mutedText}
            style={styles.searchInput}
          />

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Source</Text>
            <View style={styles.chipsRow}>
              {[
                { id: 'all', label: 'All' },
                { id: 'planned', label: 'Routines' },
                { id: 'completed', label: 'Completed' },
              ].map((item) => (
                <AppChip
                  key={item.id}
                  label={item.label}
                  selected={sourceFilter === item.id}
                  onPress={() => setSourceFilter(item.id as 'all' | EntrySource)}
                />
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Split</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.splitScroll}>
              {splitOptions.map((option) => (
                <AppChip
                  key={option}
                  label={option === 'all' ? 'All' : formatSplit(option)}
                  selected={splitFilter === option}
                  onPress={() => setSplitFilter(option)}
                />
              ))}
            </ScrollView>
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Selected Day</Text>
          <Text style={styles.sectionMeta}>{formatDisplayDate(selectedDate)}</Text>

          {selectedDateEntries.length ? (
            selectedDateEntries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryCopy}>
                    <Text style={styles.entryTitle}>{entry.title}</Text>
                    <Text style={styles.entryMeta}>{entry.summary}</Text>
                  </View>
                  <Text style={[styles.entryTag, entry.source === 'planned' ? styles.entryTagPlanned : styles.entryTagDone]}>
                    {entry.source === 'planned' ? 'Routine' : 'Completed'}
                  </Text>
                </View>

                <View style={styles.exerciseList}>
                  {entry.exercises.map((exercise) => (
                    <Pressable key={exercise.id} style={styles.exerciseRow} onPress={() => setExerciseDetail(exercise)}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseMeta}>{`${exercise.sets} x ${exercise.reps} x ${exercise.weight}kg`}</Text>
                    </Pressable>
                  ))}
                </View>

                {entry.source === 'planned' ? (
                  <View style={{ marginTop: spacing.xs }}>
                    <AppButton onPress={() => startFromPlan(entry)}>Start Routine</AppButton>
                  </View>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No sessions match your filters for this day.</Text>
          )}
        </AppCard>
      </ScrollView>

      <Modal visible={Boolean(exerciseDetail)} transparent animationType="slide" onRequestClose={() => setExerciseDetail(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{exerciseDetail?.name ?? 'Exercise'}</Text>
            <Text style={styles.modalBody}>{exerciseDetail ? `${exerciseDetail.sets} sets x ${exerciseDetail.reps} reps x ${exerciseDetail.weight}kg` : ''}</Text>
            {exerciseDetail?.note ? <Text style={styles.modalBody}>{exerciseDetail.note}</Text> : null}
            <AppButton variant="secondary" style={styles.modalButton} onPress={() => setExerciseDetail(null)}>
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
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  header: {
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  calendarCard: {
    backgroundColor: colors.surface,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  sectionMeta: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  searchInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundElevated,
    color: colors.text,
    paddingHorizontal: spacing.sm,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  filterSection: {
    gap: spacing.xs,
  },
  filterLabel: {
    color: colors.mutedText,
    fontSize: typography.tiny,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  splitScroll: {
    gap: spacing.xs,
  },
  entryCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundElevated,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  entryCopy: {
    flex: 1,
    gap: 2,
  },
  entryTitle: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  entryMeta: {
    color: colors.mutedText,
    fontSize: typography.tiny,
  },
  entryTag: {
    minWidth: 86,
    textAlign: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    fontSize: typography.tiny,
    fontWeight: '700',
    overflow: 'hidden',
  },
  entryTagPlanned: {
    color: colors.primary,
    backgroundColor: 'rgba(10,132,255,0.16)',
  },
  entryTagDone: {
    color: colors.accent,
    backgroundColor: 'rgba(52,199,89,0.16)',
  },
  exerciseList: {
    gap: spacing.xs,
  },
  exerciseRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: 2,
  },
  exerciseName: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  exerciseMeta: {
    color: colors.mutedText,
    fontSize: typography.tiny,
  },
  emptyText: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#000000A6',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  modalTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  modalBody: {
    color: colors.mutedText,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  modalButton: {
    marginTop: spacing.xs,
  },
});
