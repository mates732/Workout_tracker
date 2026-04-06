import { useCallback, useEffect } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppCard, AppChip, AppInput } from '../../shared/components/ui';
import { useDeviceReader } from '../../shared/device/useDeviceReader';
import {
  type AiCoachStyle,
  type EquipmentType,
  type HistoryLimit,
  type TrainingType,
  type UserAppSettings,
  type UserGoal,
  type UserLevel,
  type Weekday,
  type WeightUnits,
} from '../../shared/state/userAppSettingsStore';
import { useWorkoutFlow } from '../../shared/state/WorkoutFlowContext';
import { colors, spacing, typography } from '../../shared/theme/tokens';

const LEVELS: UserLevel[] = ['beginner', 'intermediate', 'advanced'];
const GOALS: UserGoal[] = ['fat_loss', 'muscle_gain', 'maintenance'];
const TRAINING_TYPES: TrainingType[] = ['full_body', 'split', 'push_pull_legs', 'custom'];
const TRAINING_DAYS: Array<{ key: Weekday; label: string }> = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];
const EQUIPMENT_TYPES: EquipmentType[] = ['gym', 'home', 'bodyweight'];
const WEIGHT_UNITS: WeightUnits[] = ['kg', 'lbs'];
const COACH_STYLES: AiCoachStyle[] = ['motivational', 'strict', 'neutral'];
const HISTORY_LIMITS: HistoryLimit[] = ['30_days', 'unlimited'];

function parsePositiveInt(value: string, fallback: number): number {
  const parsed = Number.parseInt(value.replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePositiveNumber(value: string, fallback: number): number {
  const parsed = Number.parseFloat(value.replace(/[^0-9.,]/g, '').replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function ProfileScreen() {
  const { settings, updateSettings, workoutPlan } = useWorkoutFlow();
  const insets = useSafeAreaInsets();
  const { horizontalGutter } = useDeviceReader();

  const mutate = useCallback((updater: (current: UserAppSettings) => UserAppSettings) => {
    updateSettings(updater);
  }, [updateSettings]);

  useEffect(() => {
    if (settings.general.theme === 'dark') {
      return;
    }

    mutate((current) => ({
      ...current,
      general: {
        ...current.general,
        theme: 'dark',
      },
    }));
  }, [mutate, settings.general.theme]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      edges={[]}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingHorizontal: horizontalGutter }]}>
        <View>
          <Text style={styles.pageTitle}>Settings</Text>
          <Text style={styles.pageSubtitle}>Adjust your coach, profile, workout plan, tracking, and general preferences.</Text>
        </View>

        <AppCard>
          <Text style={styles.sectionTitle}>Connected System</Text>
          <Text style={styles.fieldLabel}>Next workout preview</Text>
          <Text style={styles.previewTitle}>{workoutPlan?.title ?? 'Adaptive plan ready'}</Text>
          <Text style={styles.previewBody}>{workoutPlan?.summary ?? 'Settings changes will drive your next generated workout.'}</Text>
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>AI Coach</Text>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Enabled</Text>
            <Switch
              value={settings.ai_coach.enabled}
              onValueChange={(value) =>
                mutate((current) => ({
                  ...current,
                  ai_coach: {
                    ...current.ai_coach,
                    enabled: value,
                  },
                }))
              }
            />
          </View>
          <Text style={styles.fieldLabel}>Coach style</Text>
          <View style={styles.chipsRow}>
            {COACH_STYLES.map((style) => (
              <AppChip
                key={style}
                label={style}
                selected={settings.ai_coach.style === style}
                onPress={() =>
                  mutate((current) => ({
                    ...current,
                    ai_coach: {
                      ...current.ai_coach,
                      style,
                    },
                  }))
                }
              />
            ))}
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Adaptive training</Text>
            <Switch
              value={settings.ai_coach.adaptive_training}
              onValueChange={(value) =>
                mutate((current) => ({
                  ...current,
                  ai_coach: {
                    ...current.ai_coach,
                    adaptive_training: value,
                  },
                }))
              }
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Progression</Text>
            <Switch
              value={settings.ai_coach.auto_progression}
              onValueChange={(value) =>
                mutate((current) => ({
                  ...current,
                  ai_coach: {
                    ...current.ai_coach,
                    auto_progression: value,
                  },
                }))
              }
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Post-workout feedback</Text>
            <Switch
              value={settings.ai_coach.post_workout_feedback}
              onValueChange={(value) =>
                mutate((current) => ({
                  ...current,
                  ai_coach: {
                    ...current.ai_coach,
                    post_workout_feedback: value,
                  },
                }))
              }
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Fatigue adjustment</Text>
            <Switch
              value={settings.ai_coach.fatigue_adjustment}
              onValueChange={(value) =>
                mutate((current) => ({
                  ...current,
                  ai_coach: {
                    ...current.ai_coach,
                    fatigue_adjustment: value,
                  },
                }))
              }
            />
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.row}>
            <AppInput
              style={styles.half}
              value={String(settings.profile.height_cm)}
              keyboardType="number-pad"
              onChangeText={(value) =>
                mutate((current) => ({
                  ...current,
                  profile: {
                    ...current.profile,
                    height_cm: parsePositiveInt(value, current.profile.height_cm),
                  },
                }))
              }
              placeholder="Height (cm)"
            />
            <AppInput
              style={styles.half}
              value={String(settings.profile.weight_kg)}
              keyboardType="decimal-pad"
              onChangeText={(value) =>
                mutate((current) => ({
                  ...current,
                  profile: {
                    ...current.profile,
                    weight_kg: parsePositiveNumber(value, current.profile.weight_kg),
                  },
                }))
              }
              placeholder="Weight"
            />
          </View>
          <Text style={styles.fieldLabel}>Level</Text>
          <View style={styles.chipsRow}>
            {LEVELS.map((level) => (
              <AppChip
                key={level}
                label={level}
                selected={settings.profile.level === level}
                onPress={() =>
                  mutate((current) => ({
                    ...current,
                    profile: {
                      ...current.profile,
                      level,
                    },
                  }))
                }
              />
            ))}
          </View>
          <Text style={styles.fieldLabel}>Goal</Text>
          <View style={styles.chipsRow}>
            {GOALS.map((goal) => (
              <AppChip
                key={goal}
                label={goal.replace('_', ' ')}
                selected={settings.profile.goal === goal}
                onPress={() =>
                  mutate((current) => ({
                    ...current,
                    profile: {
                      ...current.profile,
                      goal,
                    },
                  }))
                }
              />
            ))}
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Workout</Text>
          <Text style={styles.fieldLabel}>Split type</Text>
          <View style={styles.chipsRow}>
            {TRAINING_TYPES.map((trainingType) => {
              const label =
                trainingType === 'full_body'
                  ? 'Full Body'
                  : trainingType === 'split'
                  ? 'Upper / Lower'
                  : trainingType === 'push_pull_legs'
                  ? 'Push / Pull / Legs'
                  : trainingType === 'custom'
                  ? 'Custom'
                  : String(trainingType);

              return (
                <AppChip
                  key={trainingType}
                  label={label}
                  selected={settings.workout.training_type === trainingType}
                  onPress={() =>
                    mutate((current) => ({
                      ...current,
                      workout: {
                        ...current.workout,
                        training_type: trainingType,
                      },
                    }))
                  }
                />
              );
            })}
          </View>
          <Text style={styles.fieldLabel}>Training days</Text>
          <View style={styles.chipsRow}>
            {TRAINING_DAYS.map((day) => {
              const selected = settings.workout.training_days.includes(day.key);
              return (
                <AppChip
                  key={day.key}
                  label={day.label}
                  selected={selected}
                  onPress={() =>
                    mutate((current) => ({
                      ...current,
                      workout: {
                        ...current.workout,
                        training_days: selected
                          ? current.workout.training_days.filter((item) => item !== day.key)
                          : [...current.workout.training_days, day.key],
                      },
                    }))
                  }
                />
              );
            })}
          </View>
          <Text style={styles.fieldLabel}>Duration</Text>
          <AppInput
            value={String(settings.workout.session_duration_min)}
            keyboardType="number-pad"
            onChangeText={(value) =>
              mutate((current) => ({
                ...current,
                workout: {
                  ...current.workout,
                  session_duration_min: parsePositiveInt(value, current.workout.session_duration_min),
                },
              }))
            }
            placeholder="Session (min)"
          />
          <Text style={styles.fieldLabel}>Equipment</Text>
          <View style={styles.chipsRow}>
            {EQUIPMENT_TYPES.map((equipment) => (
              <AppChip
                key={equipment}
                label={equipment}
                selected={settings.workout.equipment === equipment}
                onPress={() =>
                  mutate((current) => ({
                    ...current,
                    workout: {
                      ...current.workout,
                      equipment,
                    },
                  }))
                }
              />
            ))}
          </View>
          <Text style={styles.fieldLabel}>Rest timer (sec)</Text>
          <AppInput
            value={String(settings.workout.rest_timer_sec)}
            keyboardType="number-pad"
            onChangeText={(value) =>
              mutate((current) => ({
                ...current,
                workout: {
                  ...current.workout,
                  rest_timer_sec: parsePositiveInt(value, current.workout.rest_timer_sec),
                },
              }))
            }
            placeholder="Rest timer"
          />
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Tracking</Text>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Log weights</Text>
            <Switch
              value={settings.tracking.log_weights}
              onValueChange={(value) =>
                mutate((current) => ({
                  ...current,
                  tracking: {
                    ...current.tracking,
                    log_weights: value,
                  },
                }))
              }
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Log reps</Text>
            <Switch
              value={settings.tracking.log_reps}
              onValueChange={(value) =>
                mutate((current) => ({
                  ...current,
                  tracking: {
                    ...current.tracking,
                    log_reps: value,
                  },
                }))
              }
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Auto save</Text>
            <Switch
              value={settings.tracking.auto_save}
              onValueChange={(value) =>
                mutate((current) => ({
                  ...current,
                  tracking: {
                    ...current.tracking,
                    auto_save: value,
                  },
                }))
              }
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>PR tracking</Text>
            <Switch
              value={settings.tracking.track_prs}
              onValueChange={(value) =>
                mutate((current) => ({
                  ...current,
                  tracking: {
                    ...current.tracking,
                    track_prs: value,
                  },
                }))
              }
            />
          </View>
          <Text style={styles.fieldLabel}>History retention</Text>
          <View style={styles.chipsRow}>
            {HISTORY_LIMITS.map((limit) => (
              <AppChip
                key={limit}
                label={limit.replace('_', ' ')}
                selected={settings.tracking.history_limit === limit}
                onPress={() =>
                  mutate((current) => ({
                    ...current,
                    tracking: {
                      ...current.tracking,
                      history_limit: limit,
                    },
                  }))
                }
              />
            ))}
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>General</Text>
          <Text style={styles.fieldLabel}>Email</Text>
          <AppInput
            value={settings.account.email}
            onChangeText={(value) =>
              mutate((current) => ({
                ...current,
                account: {
                  ...current.account,
                  email: value.trim(),
                },
              }))
            }
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Email"
          />
          <Text style={styles.fieldLabel}>Units</Text>
          <View style={styles.chipsRow}>
            {WEIGHT_UNITS.map((units) => (
              <AppChip
                key={units}
                label={units}
                selected={settings.workout.units === units}
                onPress={() =>
                  mutate((current) => ({
                    ...current,
                    workout: {
                      ...current.workout,
                      units,
                    },
                  }))
                }
              />
            ))}
          </View>
          <Text style={styles.fieldLabel}>Theme</Text>
          <Text style={styles.previewBody}>Dark mode is always enabled for a clean, premium workout experience.</Text>
          <Text style={styles.fieldLabel}>Calendar preview</Text>
          <View style={styles.chipsRow}>
            {[
              { label: '1w', days: 7 },
              { label: '2w', days: 14 },
              { label: '1m', days: 30 },
              { label: '2m', days: 60 },
            ].map((opt) => (
              <AppChip
                key={opt.label}
                label={opt.label}
                selected={settings.general.calendar_preview_days === opt.days}
                onPress={() =>
                  mutate((current) => ({
                    ...current,
                    general: {
                      ...current.general,
                      calendar_preview_days: opt.days,
                    },
                  }))
                }
              />
            ))}
          </View>
          <Text style={styles.fieldLabel}>Reminder time</Text>
          <AppInput
            value={settings.notifications.workout_reminders.time}
            onChangeText={(value) =>
              mutate((current) => ({
                ...current,
                notifications: {
                  ...current.notifications,
                  workout_reminders: {
                    ...current.notifications.workout_reminders,
                    time: value,
                  },
                },
              }))
            }
            placeholder="18:00"
          />
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>AI suggestions</Text>
            <Switch
              value={settings.notifications.ai_suggestions}
              onValueChange={(value) =>
                mutate((current) => ({
                  ...current,
                  notifications: {
                    ...current.notifications,
                    ai_suggestions: value,
                  },
                }))
              }
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Streak alerts</Text>
            <Switch
              value={settings.notifications.streak_alerts}
              onValueChange={(value) =>
                mutate((current) => ({
                  ...current,
                  notifications: {
                    ...current.notifications,
                    streak_alerts: value,
                  },
                }))
              }
            />
          </View>
        </AppCard>
      </ScrollView>
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
    paddingTop: spacing.sm,
    paddingBottom: 108,
  },
  pageTitle: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '700',
  },
  pageSubtitle: {
    marginTop: 2,
    color: colors.mutedText,
    fontSize: typography.body,
    lineHeight: 22,
  },
  previewTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  previewBody: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
  },
  previewMetaLine: { color: colors.mutedText, fontSize: typography.tiny, marginTop: 4 },
  exerciseListMinimal: { marginTop: 6 },
  exerciseName: { color: colors.text, fontSize: typography.body },
  moreText: { color: colors.mutedText, fontSize: typography.tiny, marginTop: 4 },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  half: {
    flex: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fieldLabel: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  toggleRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  toggleLabel: {
    color: colors.text,
    fontSize: typography.body,
    flex: 1,
  },
});
