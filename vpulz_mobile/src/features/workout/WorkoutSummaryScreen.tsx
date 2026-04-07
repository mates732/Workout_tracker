import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { AppButton, AppCard } from '../../shared/components/ui';
import { generateFeedback } from '../../shared/state/settingsLogic';
import { useWorkoutFlow } from '../../shared/state/WorkoutFlowContext';
import { colors, radius, spacing, typography } from '../../shared/theme/tokens';

type WorkoutSummaryNavigationProp = NativeStackNavigationProp<RootStackParamList, 'WorkoutSummary'>;
type WorkoutSummaryRouteProp = RouteProp<RootStackParamList, 'WorkoutSummary'>;

function formatVolume(volume: number): string {
  return `${Math.round(volume).toLocaleString()} kg`;
}

function toShortFeedback(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return 'Strong session. Recover and come back sharper.';
  }

  const firstSentence = trimmed.split(/[.!?]\s/)[0]?.trim();
  if (!firstSentence) {
    return trimmed;
  }

  return firstSentence.endsWith('.') ? firstSentence : `${firstSentence}.`;
}

export function WorkoutSummaryScreen() {
  const navigation = useNavigation<WorkoutSummaryNavigationProp>();
  const route = useRoute<WorkoutSummaryRouteProp>();
  const { summary, nextPlan } = route.params;
  const insets = useSafeAreaInsets();
  const { setCurrentWorkout } = useWorkoutFlow();

  const startNextWorkout = () => {
    if (!nextPlan) {
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      return;
    }

    setCurrentWorkout(nextPlan);
    navigation.replace('ActiveWorkout');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]} edges={[]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{nextPlan ? 'Workout Complete' : 'Workout Detail'}</Text>
          <Text style={styles.title}>{nextPlan ? 'AI feedback is ready' : 'Saved workout summary'}</Text>
          <Text style={styles.subtitle}>{summary.summaryLine}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>{summary.durationMinutes}m</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Volume</Text>
            <Text style={styles.statValue}>{formatVolume(summary.totalVolume)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>PRs</Text>
            <Text style={styles.statValue}>{summary.prs}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={styles.statValue}>{summary.performance.toFixed(2)}</Text>
          </View>
        </View>

        <AppCard>
          <Text style={styles.sectionLabel}>Post Workout Feedback</Text>
          <Text style={styles.feedbackText}>{toShortFeedback(summary.feedback ?? generateFeedback(summary.performance))}</Text>
          <Text style={styles.supportText}>Total sets logged: {summary.completedSets}</Text>
        </AppCard>

        <AppCard>
          <Text style={styles.sectionLabel}>Next Workout</Text>
          <Text style={styles.nextTitle}>{nextPlan?.title ?? 'Adaptive plan ready'}</Text>
          <Text style={styles.nextBody}>{nextPlan?.recommendation ?? generateFeedback(summary.performance)}</Text>
          <Text style={styles.supportText}>{nextPlan?.summary ?? 'Open Home to start the next workout instantly.'}</Text>
        </AppCard>

        {nextPlan ? (
          <View style={styles.actions}>
            <AppButton style={styles.actionButton} onPress={startNextWorkout}>
              Start Next Workout
            </AppButton>
            <AppButton
              variant="secondary"
              style={styles.actionButton}
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}
            >
              Back to Home
            </AppButton>
          </View>
        ) : (
          <AppButton
            style={styles.doneButton}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}
          >
            Back to Home
          </AppButton>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    flexGrow: 1,
  },
  header: {
    gap: 4,
  },
  eyebrow: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: typography.body,
    lineHeight: 22,
  },
  statsGrid: {
    gap: spacing.sm,
  },
  statCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: 4,
  },
  statLabel: {
    color: colors.mutedText,
    fontSize: typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionLabel: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  feedbackText: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 24,
  },
  nextTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  nextBody: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
  },
  supportText: {
    color: colors.mutedText,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  doneButton: {
    marginTop: 'auto',
    minHeight: 56,
  },
  actions: {
    marginTop: 'auto',
    gap: spacing.sm,
  },
  actionButton: {
    minHeight: 56,
  },
});
