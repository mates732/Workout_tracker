import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, AppCard } from '../../shared/components/ui';
import { useDeviceReader } from '../../shared/device/useDeviceReader';
import { colors, radius, spacing, typography } from '../../shared/theme/tokens';
import { loadUserAppSettings, saveUserAppSettings, type UserAppSettings } from '../../shared/state/userAppSettingsStore';

type CalendarState = 'none' | 'completed' | 'planned';

type CalendarDay = {
  iso: string;
  date: Date;
  state: CalendarState;
  workoutType: string;
  exercises: string[];
};

const PPL_WORKOUTS = ['Push', 'Pull', 'Legs'] as const;
const PPL_EXERCISES: Record<(typeof PPL_WORKOUTS)[number], string[]> = {
  Push: ['Bench Press', 'Incline Press', 'Overhead Press', 'Triceps Extension'],
  Pull: ['Pull Up', 'Barbell Row', 'Face Pull', 'Biceps Curl'],
  Legs: ['Back Squat', 'Romanian Deadlift', 'Leg Press', 'Calf Raise'],
};

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDefaultWorkoutForDate(dayOfMonth: number, settings: UserAppSettings): { workoutType: string; exercises: string[] } {
  if (settings.trainingSplit === 'full_body') {
    return {
      workoutType: 'Full Body',
      exercises: ['Squat', 'Bench Press', 'Row', 'Overhead Press'],
    };
  }

  if (settings.trainingSplit === 'custom') {
    return {
      workoutType: settings.customSplitName || 'Custom Session',
      exercises: ['Custom Exercise 1', 'Custom Exercise 2', 'Custom Exercise 3'],
    };
  }

  const workoutType = PPL_WORKOUTS[(dayOfMonth - 1) % PPL_WORKOUTS.length];
  return {
    workoutType,
    exercises: PPL_EXERCISES[workoutType],
  };
}

function isPlannedDay(dayOfMonth: number, settings: UserAppSettings): boolean {
  if (settings.trainingSplit === 'full_body') {
    return dayOfMonth % 2 === 1;
  }

  if (settings.trainingSplit === 'custom') {
    return dayOfMonth % 2 === 0;
  }

  return dayOfMonth % 2 === 1;
}

function buildMonthCalendar(settings: UserAppSettings): CalendarDay[] {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const days: CalendarDay[] = [];

  for (let day = 1; day <= end.getDate(); day += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), day);
    const iso = toLocalDateKey(date);
    const defaultWorkout = getDefaultWorkoutForDate(day, settings);

    const workoutType = settings.plannedWorkoutOverrides[iso] ?? defaultWorkout.workoutType;
    const exercises = settings.plannedExerciseOverrides[iso] ?? defaultWorkout.exercises;
    const planned = isPlannedDay(day, settings);
    const completed = Boolean(settings.completedDates[iso]);

    days.push({
      iso,
      date,
      workoutType,
      exercises,
      state: completed ? 'completed' : planned ? 'planned' : 'none',
    });
  }

  return days;
}

export function ProgressScreen() {
  const [settings, setSettings] = useState<UserAppSettings | null>(null);
  const [selectedDayIso, setSelectedDayIso] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [exercisesDraft, setExercisesDraft] = useState('');
  const { safeAreaPadding, horizontalGutter } = useDeviceReader();

  useEffect(() => {
    void loadUserAppSettings().then((value) => {
      setSettings(value);
    });
  }, []);

  const calendarDays = useMemo(() => {
    if (!settings) {
      return [];
    }
    return buildMonthCalendar(settings);
  }, [settings]);

  const selectedDay = useMemo(
    () => calendarDays.find((day) => day.iso === selectedDayIso) ?? null,
    [calendarDays, selectedDayIso]
  );

  const openDay = (day: CalendarDay) => {
    if (day.state === 'none') {
      return;
    }
    setSelectedDayIso(day.iso);
    setTitleDraft(day.workoutType);
    setExercisesDraft(day.exercises.join(', '));
  };

  const saveWorkoutEdits = async () => {
    if (!settings || !selectedDay) {
      return;
    }

    const next: UserAppSettings = {
      ...settings,
      plannedWorkoutOverrides: {
        ...settings.plannedWorkoutOverrides,
        [selectedDay.iso]: titleDraft.trim() || selectedDay.workoutType,
      },
      plannedExerciseOverrides: {
        ...settings.plannedExerciseOverrides,
        [selectedDay.iso]: exercisesDraft
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      },
    };

    setSettings(next);
    await saveUserAppSettings(next);
    setSelectedDayIso(null);
  };

  const markCompleted = async () => {
    if (!settings || !selectedDay) {
      return;
    }

    const next: UserAppSettings = {
      ...settings,
      completedDates: {
        ...settings.completedDates,
        [selectedDay.iso]: true,
      },
    };

    setSettings(next);
    await saveUserAppSettings(next);
    setSelectedDayIso(null);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { paddingTop: safeAreaPadding.paddingTop, paddingBottom: safeAreaPadding.paddingBottom }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingHorizontal: horizontalGutter }]}>
        <View>
          <Text style={styles.pageTitle}>Calendar</Text>
          <Text style={styles.pageSubtitle}>1-month view · Green = completed workout</Text>
        </View>

        <AppCard>
          <Text style={styles.metaText}>Tap a workout circle to roll up details and edit workout/exercises.</Text>
          <View style={styles.calendarGrid}>
            {calendarDays.map((day) => (
              <Pressable
                key={day.iso}
                style={[
                  styles.dayCell,
                  day.state === 'completed' ? styles.dayCompleted : null,
                  day.state === 'planned' ? styles.dayPlanned : null,
                ]}
                onPress={() => openDay(day)}
              >
                <Text style={[styles.dayDate, day.state !== 'none' ? styles.dayDateActive : null]}>{day.date.getDate()}</Text>
              </Pressable>
            ))}
          </View>
        </AppCard>
      </ScrollView>

      <Modal visible={Boolean(selectedDay)} transparent animationType="fade" onRequestClose={() => setSelectedDayIso(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedDay?.iso}</Text>
            <Text style={styles.modalHeading}>{titleDraft || selectedDay?.workoutType}</Text>

            <Text style={styles.label}>Workout Type</Text>
            <TextInput
              value={titleDraft}
              onChangeText={setTitleDraft}
              placeholder="Push / Pull / Legs / Full Body"
              placeholderTextColor={colors.mutedText}
              style={styles.input}
            />

            <Text style={styles.label}>Exercises</Text>
            <TextInput
              value={exercisesDraft}
              onChangeText={setExercisesDraft}
              placeholder="Comma-separated exercises"
              placeholderTextColor={colors.mutedText}
              style={styles.input}
            />

            <View style={styles.actions}>
              <AppButton style={styles.half} variant="secondary" onPress={() => setSelectedDayIso(null)}>
                Close
              </AppButton>
              <AppButton style={styles.half} variant="secondary" onPress={() => void markCompleted()}>
                Mark Done
              </AppButton>
              <AppButton style={styles.half} onPress={() => void saveWorkoutEdits()}>
                Save
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
  scroll: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 110,
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
  metaText: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  calendarGrid: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayCell: {
    width: '13.3%',
    minHeight: 54,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCompleted: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  dayPlanned: {
    borderColor: colors.text,
  },
  dayDate: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontWeight: '700',
  },
  dayDateActive: {
    color: colors.primaryText,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000B3',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  modalTitle: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  modalHeading: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  label: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  input: {
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated,
    color: colors.text,
    paddingHorizontal: spacing.sm,
    fontSize: typography.body,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  half: {
    flex: 1,
  },
});
