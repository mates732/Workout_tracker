import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';
import { PressableScale } from '../../shared/animations/PressableScale';
import { colors, radius, spacing, typography } from '../../shared/theme/tokens';

type WorkoutSummaryNavigationProp = NativeStackNavigationProp<RootStackParamList, 'WorkoutSummary'>;
type WorkoutSummaryRouteProp = RouteProp<RootStackParamList, 'WorkoutSummary'>;

function formatDuration(minutes: number): string {
  return `${Math.max(1, minutes)}m`;
}

function formatVolume(volume: number): string {
  return `${Math.round(volume).toLocaleString()} kg`;
}

export function WorkoutSummaryScreen() {
  const navigation = useNavigation<WorkoutSummaryNavigationProp>();
  const route = useRoute<WorkoutSummaryRouteProp>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View>
          <Text style={styles.title}>Session Complete</Text>
          <Text style={styles.subtitle}>Nice work. Here is your workout summary.</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>{formatDuration(route.params.durationMinutes)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Volume</Text>
            <Text style={styles.statValue}>{formatVolume(route.params.totalVolume)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Completed Sets</Text>
            <Text style={styles.statValue}>{route.params.totalSets}</Text>
          </View>
        </View>

        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>Highlights</Text>
          <Text style={styles.insightsBody}>{route.params.personalRecord ?? 'No PR in this session.'}</Text>
          <Text style={styles.insightsBody}>{route.params.insight ?? 'Keep your pace steady next time.'}</Text>
        </View>

        <PressableScale
          style={styles.doneButton}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}
        >
          <Text style={styles.doneButtonText}>Back to Workout</Text>
        </PressableScale>
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
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    color: colors.mutedText,
    fontSize: typography.body,
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
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  insightsCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
  },
  insightsTitle: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightsBody: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
  },
  doneButton: {
    marginTop: 'auto',
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  doneButtonText: {
    color: colors.primaryText,
    fontSize: typography.body,
    fontWeight: '700',
  },
});
