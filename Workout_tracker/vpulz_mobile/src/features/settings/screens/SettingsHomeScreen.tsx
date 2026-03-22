import { useEffect, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppState, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SettingsCard } from '../components/SettingsCard';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsScaffold } from '../components/SettingsScaffold';
import type { SettingsStackParamList } from '../SettingsNavigator';
import { useSettings } from '../state/SettingsContext';
import { loadTrackerSnapshot } from '../../../shared/state/workoutTrackerStore';
import type { WorkoutHistoryEntry } from '../../workout/workoutTracker.types';
import { useWorkoutContext } from '../../workout/state/workoutContext';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'SettingsHome'>;

const PPL_ROTATION = ['Push', 'Pull', 'Legs'] as const;

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function SettingsHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { settings, t, updateSettings, updatePlannedWorkout } = useSettings();
  const { startWorkout } = useWorkoutContext();
  const [completedByDate, setCompletedByDate] = useState<Record<string, WorkoutHistoryEntry[]>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [workoutTitleDraft, setWorkoutTitleDraft] = useState('');
  const [exerciseDraft, setExerciseDraft] = useState('');

  const loadCompletedCalendar = async () => {
    const snapshot = await loadTrackerSnapshot();
    const grouped = snapshot.workoutHistory.reduce<Record<string, WorkoutHistoryEntry[]>>((acc, entry) => {
      const dateKey = entry.date.slice(0, 10);
      const existing = acc[dateKey] ?? [];
      acc[dateKey] = [...existing, entry];
      return acc;
    }, {});
    setCompletedByDate(grouped);
  };

  useEffect(() => {
    void loadCompletedCalendar();
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void loadCompletedCalendar();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const monthDays = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const result: string[] = [];
    for (let day = 1; day <= end.getDate(); day += 1) {
      result.push(toLocalDateKey(new Date(start.getFullYear(), start.getMonth(), day)));
    }
    return result;
  }, []);

  const getPlannedWorkoutLabel = (dateKey: string): string => {
    const override = settings.calendar.planOverrides[dateKey];
    if (override) {
      return override;
    }

    if (settings.calendar.trainingPlan === 'full_body') {
      return 'Full Body';
    }

    if (settings.calendar.trainingPlan === 'custom') {
      return settings.calendar.customRoutines[0] ?? 'Custom Session';
    }

    const day = Number(dateKey.slice(-2));
    return PPL_ROTATION[(day - 1) % PPL_ROTATION.length];
  };

  const selectedDateCompleted = selectedDate ? completedByDate[selectedDate] ?? [] : [];
  const selectedDatePlanned = selectedDate ? settings.calendar.entries[selectedDate] === 'planned' : false;

  const openDateDetails = (dateKey: string) => {
    const plannedTitle = getPlannedWorkoutLabel(dateKey);
    const plannedExercises = (settings.calendar.exerciseOverrides[dateKey] ?? []).join(', ');
    setWorkoutTitleDraft(plannedTitle);
    setExerciseDraft(plannedExercises);
    setSelectedDate(dateKey);
  };

  const saveDatePlan = () => {
    if (!selectedDate) {
      return;
    }

    updatePlannedWorkout(selectedDate, workoutTitleDraft);

    updateSettings((current) => ({
      ...current,
      calendar: {
        ...current.calendar,
        exerciseOverrides: {
          ...current.calendar.exerciseOverrides,
          [selectedDate]: exerciseDraft
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        },
      },
    }));
  };

  return (
    <SettingsScaffold title="Main" subtitle="Black & white training dashboard">
      <SettingsCard>
        <Pressable
          style={styles.startWorkoutButton}
          onPress={() => {
            startWorkout();
            navigation.navigate('WorkoutSession');
          }}
        >
          <Text style={styles.startWorkoutText}>Start Workout</Text>
        </Pressable>

        <SettingsRow label="Calendar" value="1 month" helper="Green = completed · Tap a day for details" />
        <View style={styles.calendarGrid}>
          {monthDays.map((dateKey) => {
            const completedCount = completedByDate[dateKey]?.length ?? 0;
            const isCompleted = completedCount > 0;
            const isPlanned = settings.calendar.entries[dateKey] === 'planned';
            const isInteractive = isCompleted || isPlanned;

            return (
              <Pressable
                key={dateKey}
                onPress={() => {
                  if (!isInteractive) {
                    return;
                  }
                  openDateDetails(dateKey);
                }}
                style={[
                  styles.day,
                  isCompleted ? styles.dayCompleted : null,
                  !isCompleted && isPlanned ? styles.dayPlanned : null,
                ]}
              >
                <Text style={[styles.dayText, isCompleted ? styles.dayTextCompleted : null]}>{Number(dateKey.slice(-2))}</Text>
              </Pressable>
            );
          })}
        </View>

        <SettingsRow
          label={t('profile')}
          value={settings.profile.name || t('completeProfile')}
          onPress={() => navigation.navigate('ProfileSettings')}
        />
        <SettingsRow label={t('appSettings')} value={`${settings.app.themeMode} ${t('mode')}`} onPress={() => navigation.navigate('AppSettings')} />
        <SettingsRow label={t('privacySecurity')} value="Data + account controls" onPress={() => navigation.navigate('PrivacySecuritySettings')} />
      </SettingsCard>

      <Modal visible={Boolean(selectedDate)} transparent animationType="fade" onRequestClose={() => setSelectedDate(null)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Workout rollup</Text>
            <Text style={styles.modalSubtitle}>{selectedDate}</Text>

            {selectedDateCompleted.length > 0 ? (
              <View style={styles.rollupList}>
                {selectedDateCompleted.map((entry) => (
                  <View key={entry.workoutId} style={styles.rollupItem}>
                    <Text style={styles.rollupTitle}>{entry.workoutId}</Text>
                    <Text style={styles.rollupMeta}>
                      {entry.durationMinutes}m · {entry.totalSets} sets · {Math.round(entry.totalVolume)} volume
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.rollupMeta}>No completed workout on this day.</Text>
            )}

            {selectedDatePlanned ? (
              <View style={styles.editWrap}>
                <Text style={styles.rollupMeta}>Edit planned workout and exercises</Text>
                <TextInput
                  value={workoutTitleDraft}
                  onChangeText={setWorkoutTitleDraft}
                  placeholder="Workout type (Push / Pull / Legs...)"
                  placeholderTextColor="#8A8A8A"
                  style={styles.input}
                />
                <TextInput
                  value={exerciseDraft}
                  onChangeText={setExerciseDraft}
                  placeholder="Exercises separated by comma"
                  placeholderTextColor="#8A8A8A"
                  style={styles.input}
                />
                <Pressable style={styles.secondaryButton} onPress={saveDatePlan}>
                  <Text style={styles.secondaryButtonText}>Save changes</Text>
                </Pressable>
              </View>
            ) : null}

            <Pressable style={styles.closeButton} onPress={() => setSelectedDate(null)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SettingsScaffold>
  );
}

const styles = StyleSheet.create({
  startWorkoutButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startWorkoutText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  day: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2B2B2B',
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPlanned: {
    borderColor: '#FFFFFF',
  },
  dayCompleted: {
    borderColor: '#22C55E',
    backgroundColor: '#22C55E',
  },
  dayText: {
    color: '#A0A0A0',
    fontSize: 12,
    fontWeight: '600',
  },
  dayTextCompleted: {
    color: '#0A0A0A',
  },
  overlay: {
    flex: 1,
    backgroundColor: '#000000B3',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2B2B2B',
    backgroundColor: '#111111',
    padding: 16,
    gap: 10,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: '#A0A0A0',
    fontSize: 12,
  },
  rollupList: {
    gap: 8,
  },
  rollupItem: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2B2B2B',
    backgroundColor: '#1A1A1A',
    padding: 10,
    gap: 2,
  },
  rollupTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  rollupMeta: {
    color: '#A0A0A0',
    fontSize: 12,
  },
  editWrap: {
    gap: 8,
  },
  input: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2B2B2B',
    backgroundColor: '#1A1A1A',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 14,
  },
  secondaryButton: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2B2B2B',
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
});
