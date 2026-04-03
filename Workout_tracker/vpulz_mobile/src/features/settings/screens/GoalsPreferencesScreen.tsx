import { useEffect, useMemo, useState } from 'react';
import { AppState, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SettingsCard } from '../components/SettingsCard';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsScaffold } from '../components/SettingsScaffold';
import { useSettings } from '../state/SettingsContext';
import type { FitnessGoal, TrainingSplit } from '../state/settings.types';
import { loadTrackerSnapshot } from '../../../shared/state/workoutTrackerStore';
import type { WorkoutHistoryEntry } from '../../workout/workoutTracker.types';

const MUSCLE_GROUPS = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function GoalsPreferencesScreen() {
  const {
    settings,
    updateSettings,
    regenerateTrainingPlan,
    completeOnboarding,
    addCustomRoutine,
    removeCustomRoutine,
    updatePlannedWorkout,
  } = useSettings();
  const [customRoutineName, setCustomRoutineName] = useState('');
  const [plannedTitleDraft, setPlannedTitleDraft] = useState('');
  const [completedWorkoutsByDate, setCompletedWorkoutsByDate] = useState<Record<string, WorkoutHistoryEntry[]>>({});
  const [selectedWorkoutDate, setSelectedWorkoutDate] = useState<string | null>(null);

  const loadCompletedWorkoutCalendar = async () => {
    const snapshot = await loadTrackerSnapshot();
    const grouped = snapshot.workoutHistory.reduce<Record<string, WorkoutHistoryEntry[]>>((acc, workout) => {
      const dateKey = workout.date.slice(0, 10);
      const existing = acc[dateKey] ?? [];
      acc[dateKey] = [...existing, workout];
      return acc;
    }, {});

    setCompletedWorkoutsByDate(grouped);
  };

  useEffect(() => {
    void loadCompletedWorkoutCalendar();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void loadCompletedWorkoutCalendar();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const currentMonthDays = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const days: string[] = [];

    for (let day = 1; day <= end.getDate(); day += 1) {
      const date = new Date(start.getFullYear(), start.getMonth(), day);
      const iso = toLocalDateKey(date);
      days.push(iso);
    }

    return days;
  }, []);

  const selectedDateWorkouts = selectedWorkoutDate ? completedWorkoutsByDate[selectedWorkoutDate] ?? [] : [];

  const upcomingPlannedDay = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const next = Object.entries(settings.calendar.entries)
      .filter(([, state]) => state === 'planned')
      .map(([iso]) => iso)
      .filter((iso) => new Date(iso) >= today)
      .sort((left, right) => left.localeCompare(right))[0];

    return next ?? null;
  }, [settings.calendar.entries]);

  const setGoal = (goal: FitnessGoal) => {
    updateSettings((current) => ({ ...current, goals: { ...current.goals, goal } }));
  };

  const setSplit = (trainingSplit: TrainingSplit) => {
    updateSettings((current) => ({
      ...current,
      goals: { ...current.goals, trainingSplit },
      calendar: { ...current.calendar, trainingPlan: trainingSplit },
    }));
    regenerateTrainingPlan();
  };

  const savePlannedWorkoutTitle = () => {
    if (!upcomingPlannedDay) {
      return;
    }

    updatePlannedWorkout(upcomingPlannedDay, plannedTitleDraft);
    setPlannedTitleDraft('');
  };

  const toggleMuscle = (muscle: string) => {
    updateSettings((current) => {
      const exists = current.goals.preferredMuscleGroups.includes(muscle);
      return {
        ...current,
        goals: {
          ...current.goals,
          preferredMuscleGroups: exists
            ? current.goals.preferredMuscleGroups.filter((item) => item !== muscle)
            : [...current.goals.preferredMuscleGroups, muscle],
        },
      };
    });
  };

  return (
    <SettingsScaffold title="Goals & Training" subtitle="Program intent and preferences">
      {!settings.onboarding.completed ? (
        <Modal visible transparent animationType="fade">
          <View style={styles.overlay}>
            <View style={styles.onboardingCard}>
              <Text style={styles.onboardingTitle}>Choose your training plan</Text>
              <Text style={styles.onboardingSubtitle}>This powers auto weekly scheduling and calendar sync.</Text>
              <View style={styles.pillRow}>
                {(['ppl', 'full_body', 'custom'] as TrainingSplit[]).map((split) => (
                  <Pressable
                    key={split}
                    style={[styles.pill, settings.calendar.trainingPlan === split ? styles.pillActive : null]}
                    onPress={() => setSplit(split)}
                  >
                    <Text style={[styles.pillText, settings.calendar.trainingPlan === split ? styles.pillTextActive : null]}>
                      {split.replace('_', ' ')}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <AppButton onPress={() => completeOnboarding(settings.calendar.trainingPlan)}>Continue</AppButton>
            </View>
          </View>
        </Modal>
      ) : null}

      <SettingsCard>
        <SettingsRow label="Calendar" value="Green = completed workout" helper="Tap a green day to open workout detail" />
        <View style={styles.calendarGrid}>
          {currentMonthDays.map((dateKey) => {
            const dayNumber = Number(dateKey.slice(8, 10));
            const completedCount = completedWorkoutsByDate[dateKey]?.length ?? 0;
            const isCompleted = completedCount > 0;

            return (
              <Pressable
                key={dateKey}
                style={[styles.calendarDay, isCompleted ? styles.calendarDayCompleted : null]}
                onPress={() => {
                  if (!isCompleted) {
                    return;
                  }
                  setSelectedWorkoutDate(dateKey);
                }}
              >
                <Text style={[styles.calendarDayText, isCompleted ? styles.calendarDayTextCompleted : null]}>{dayNumber}</Text>
              </Pressable>
            );
          })}
        </View>
      </SettingsCard>

      <Modal visible={Boolean(selectedWorkoutDate)} transparent animationType="fade" onRequestClose={() => setSelectedWorkoutDate(null)}>
        <View style={styles.overlay}>
          <View style={styles.onboardingCard}>
            <Text style={styles.onboardingTitle}>Workout details</Text>
            <Text style={styles.onboardingSubtitle}>{selectedWorkoutDate}</Text>
            {selectedDateWorkouts.length === 0 ? (
              <Text style={styles.onboardingSubtitle}>No completed workouts.</Text>
            ) : (
              <View style={styles.detailList}>
                {selectedDateWorkouts.map((workout) => (
                  <View key={workout.workoutId} style={styles.detailItem}>
                    <Text style={styles.detailItemTitle}>{workout.workoutId}</Text>
                    <Text style={styles.detailItemMeta}>
                      {workout.durationMinutes}m · {workout.totalSets} sets · {Math.round(workout.totalVolume)} volume
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <AppButton variant="secondary" onPress={() => setSelectedWorkoutDate(null)}>
              Close
            </AppButton>
          </View>
        </View>
      </Modal>

      <SettingsCard>
        <SettingsRow label="Goal" value={settings.goals.goal.replace('_', ' ')} />
        <View style={styles.pillRow}>
          {(['hypertrophy', 'strength', 'fat_loss'] as FitnessGoal[]).map((goal) => (
            <Pressable key={goal} style={[styles.pill, settings.goals.goal === goal ? styles.pillActive : null]} onPress={() => setGoal(goal)}>
              <Text style={[styles.pillText, settings.goals.goal === goal ? styles.pillTextActive : null]}>{goal.replace('_', ' ')}</Text>
            </Pressable>
          ))}
        </View>

        <SettingsRow label="Training split" value={settings.goals.trainingSplit.replace('_', ' ')} />
        <View style={styles.pillRow}>
          {(['ppl', 'full_body', 'custom'] as TrainingSplit[]).map((split) => (
            <Pressable key={split} style={[styles.pill, settings.goals.trainingSplit === split ? styles.pillActive : null]} onPress={() => setSplit(split)}>
              <Text style={[styles.pillText, settings.goals.trainingSplit === split ? styles.pillTextActive : null]}>{split.replace('_', ' ')}</Text>
            </Pressable>
          ))}
        </View>

        <SettingsRow
          label="Workout days per week"
          value={String(settings.goals.workoutDaysPerWeek)}
          helper="Tap to cycle 2-7"
          onPress={() =>
            updateSettings((current) => ({
              ...current,
              goals: {
                ...current.goals,
                workoutDaysPerWeek: current.goals.workoutDaysPerWeek >= 7 ? 2 : current.goals.workoutDaysPerWeek + 1,
              },
            }))
          }
        />

        <SettingsRow label="Preferred muscle groups" helper="Tap chips to toggle" />
        <View style={styles.pillRow}>
          {MUSCLE_GROUPS.map((muscle) => {
            const active = settings.goals.preferredMuscleGroups.includes(muscle);
            return (
              <Pressable key={muscle} style={[styles.pill, active ? styles.pillActive : null]} onPress={() => toggleMuscle(muscle)}>
                <Text style={[styles.pillText, active ? styles.pillTextActive : null]}>{muscle}</Text>
              </Pressable>
            );
          })}
        </View>
      </SettingsCard>

      <SettingsCard>
        <SettingsRow label="Training plan sync" value="Calendar linked" helper="Regenerate after any split/routine change" />
        <AppButton variant="secondary" onPress={regenerateTrainingPlan}>
          Regenerate weekly schedule
        </AppButton>
      </SettingsCard>

      <SettingsCard>
        <SettingsRow label="Edit planned workout" value={upcomingPlannedDay ?? 'No upcoming planned day'} />
        <TextInput
          value={plannedTitleDraft}
          onChangeText={setPlannedTitleDraft}
          placeholder="Workout name for next planned day"
          placeholderTextColor="#666666"
          style={styles.textInput}
        />
        <AppButton onPress={savePlannedWorkoutTitle} variant="secondary">
          Save planned workout
        </AppButton>
      </SettingsCard>

      <SettingsCard>
        <SettingsRow label="Custom routines" value={`${settings.calendar.customRoutines.length} saved`} helper="Used when split = custom" />
        <View style={styles.pillRow}>
          {(() => {
            const PALETTE = ['#FF6B6B', '#FFB86B', '#FFD86B', '#7AB3FF', '#7AE1AB', '#D9A7FF'];
            return settings.calendar.customRoutines.map((routine) => {
              const currentColor = settings.calendar.routineColors?.[routine] ?? PALETTE[0];
              return (
                <View key={routine} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Pressable
                    onPress={() => {
                      const idx = PALETTE.indexOf(currentColor);
                      const next = PALETTE[(idx + 1) % PALETTE.length];
                      updateSettings((current) => ({
                        ...current,
                        calendar: {
                          ...current.calendar,
                          routineColors: {
                            ...(current.calendar.routineColors ?? {}),
                            [routine]: next,
                          },
                        },
                      }));
                    }}
                    style={{ width: 28, height: 20, borderRadius: 6, backgroundColor: currentColor, borderWidth: 1, borderColor: '#303030', marginRight: 6 }}
                  />
                  <Pressable style={styles.pill} onPress={() => removeCustomRoutine(routine)}>
                    <Text style={styles.pillText}>{routine} ✕</Text>
                  </Pressable>
                </View>
              );
            });
          })()}
        </View>

        <TextInput
          value={customRoutineName}
          onChangeText={setCustomRoutineName}
          placeholder="Create custom routine"
          placeholderTextColor="#666666"
          style={styles.textInput}
        />
        <AppButton
          onPress={() => {
            addCustomRoutine(customRoutineName);
            setCustomRoutineName('');
          }}
        >
          Add routine
        </AppButton>
      </SettingsCard>
    </SettingsScaffold>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000B3',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  onboardingCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#303030',
    backgroundColor: '#0D0D0D',
    padding: 16,
    gap: 12,
  },
  onboardingTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  onboardingSubtitle: {
    color: '#A2A2A2',
    fontSize: 13,
    lineHeight: 19,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#303030',
    backgroundColor: '#111111',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  pillText: {
    color: '#B9B9B9',
    fontSize: 12,
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#000000',
  },
  textInput: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#303030',
    backgroundColor: '#111111',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  calendarDay: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2C2C2C',
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayCompleted: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  calendarDayText: {
    color: '#B9B9B9',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarDayTextCompleted: {
    color: '#0B0B0B',
  },
  detailList: {
    gap: 8,
  },
  detailItem: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#303030',
    backgroundColor: '#111111',
    padding: 10,
    gap: 4,
  },
  detailItemTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  detailItemMeta: {
    color: '#A2A2A2',
    fontSize: 12,
  },
});

function AppButton({
  children,
  onPress,
  variant = 'primary',
}: {
  children: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <Pressable style={[buttonStyles.base, variant === 'secondary' ? buttonStyles.secondary : buttonStyles.primary]} onPress={onPress}>
      <Text style={[buttonStyles.text, variant === 'secondary' ? buttonStyles.textSecondary : buttonStyles.textPrimary]}>{children}</Text>
    </Pressable>
  );
}

const buttonStyles = StyleSheet.create({
  base: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  primary: {
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
  },
  secondary: {
    borderColor: '#303030',
    backgroundColor: '#111111',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  textPrimary: {
    color: '#000000',
  },
  textSecondary: {
    color: '#FFFFFF',
  },
});
