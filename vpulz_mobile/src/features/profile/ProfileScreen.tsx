import { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, AppChip, AppInput } from '../../shared/components/ui';
import { useWorkoutFlow } from '../../shared/state/WorkoutFlowContext';
import { colors, spacing, typography } from '../../shared/theme/tokens';

type Level = 'beginner' | 'intermediate' | 'advanced';
type Goal = 'strength' | 'hypertrophy' | 'fat_loss';

const GOALS: Goal[] = ['strength', 'hypertrophy', 'fat_loss'];
const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];
const EQUIPMENT = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight'];

export function ProfileScreen() {
  const { connection, setConnection, busy } = useWorkoutFlow();

  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal>('strength');
  const [level, setLevel] = useState<Level>('intermediate');
  const [equipment, setEquipment] = useState<string[]>(['barbell', 'dumbbell']);
  const [age, setAge] = useState('25');
  const [height, setHeight] = useState('180');
  const [weight, setWeight] = useState('80');

  const [baseUrl, setBaseUrl] = useState(connection.baseUrl);
  const [token, setToken] = useState(connection.token);
  const [userId, setUserId] = useState(connection.userId);

  const progressText = useMemo(() => `Step ${step + 1} / 4`, [step]);

  const toggleEquipment = (item: string) => {
    setEquipment((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item]
    );
  };

  const saveConnection = () => {
    setConnection({ baseUrl, token, userId });
  };

  const canContinue =
    step < 3 || (age.trim().length > 0 && height.trim().length > 0 && weight.trim().length > 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View>
          <Text style={styles.pageTitle}>Profile Setup</Text>
          <Text style={styles.pageSubtitle}>Fast onboarding for personalized workout coaching</Text>
        </View>

        <AppCard>
          <Text style={styles.stepBadge}>{progressText}</Text>

          {step === 0 ? (
            <>
              <Text style={styles.stepTitle}>What is your main goal?</Text>
              <View style={styles.chipsRow}>
                {GOALS.map((item) => (
                  <AppChip
                    key={item}
                    label={item.replace('_', ' ')}
                    selected={goal === item}
                    onPress={() => setGoal(item)}
                  />
                ))}
              </View>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <Text style={styles.stepTitle}>Training level</Text>
              <View style={styles.chipsRow}>
                {LEVELS.map((item) => (
                  <AppChip key={item} label={item} selected={level === item} onPress={() => setLevel(item)} />
                ))}
              </View>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Text style={styles.stepTitle}>Available equipment</Text>
              <View style={styles.chipsRow}>
                {EQUIPMENT.map((item) => (
                  <AppChip
                    key={item}
                    label={item}
                    selected={equipment.includes(item)}
                    onPress={() => toggleEquipment(item)}
                  />
                ))}
              </View>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <Text style={styles.stepTitle}>Body stats</Text>
              <AppInput value={age} onChangeText={setAge} keyboardType="number-pad" placeholder="Age" />
              <AppInput
                value={height}
                onChangeText={setHeight}
                keyboardType="number-pad"
                placeholder="Height (cm)"
              />
              <AppInput
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholder="Weight (kg)"
              />
            </>
          ) : null}

          <View style={styles.actionsRow}>
            <AppButton
              style={styles.actionHalf}
              variant="secondary"
              onPress={() => setStep((current) => Math.max(0, current - 1))}
            >
              Back
            </AppButton>
            <AppButton
              style={styles.actionHalf}
              onPress={() => {
                if (step < 3 && canContinue) {
                  setStep(step + 1);
                  return;
                }
                if (step === 3 && canContinue) {
                  setStep(0);
                }
              }}
            >
              {step === 3 ? 'Finish' : 'Next'}
            </AppButton>
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Connection</Text>
          <Text style={styles.sectionBody}>Keep this minimal and edit only when needed.</Text>
          <AppInput value={baseUrl} onChangeText={setBaseUrl} autoCapitalize="none" placeholder="Backend URL" />
          <AppInput value={token} onChangeText={setToken} autoCapitalize="none" placeholder="Token" />
          <AppInput value={userId} onChangeText={setUserId} autoCapitalize="none" placeholder="User ID" />
          <AppButton onPress={saveConnection}>{busy ? 'Saving...' : 'Save Connection'}</AppButton>
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
    marginTop: 2,
    color: colors.mutedText,
    fontSize: typography.body,
  },
  stepBadge: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionHalf: {
    flex: 1,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  sectionBody: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
});
