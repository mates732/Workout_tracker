import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { formatDuration } from '../../store/workoutStore';
import { colors, radius, shadows, spacing, typography } from '../../shared/theme/tokens';

type Nav = NativeStackNavigationProp<RootStackParamList, 'WorkoutSummary'>;
type SummaryRoute = RouteProp<RootStackParamList, 'WorkoutSummary'>;

export function WorkoutSummaryScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<SummaryRoute>();
  const insets = useSafeAreaInsets();
  const { entry } = route.params;

  const handleDone = () => {
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Success indicator */}
        <View style={styles.successIcon}>
          <Text style={styles.successEmoji}>💪</Text>
        </View>

        <Text style={styles.title}>Workout Complete!</Text>
        <Text style={styles.workoutName}>{entry.workoutName}</Text>
        <Text style={styles.completedDate}>
          {new Date(entry.completedAt).toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {formatDuration(entry.durationSec)}
            </Text>
            <Text style={styles.statLabel}>DURATION</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{entry.exerciseCount}</Text>
            <Text style={styles.statLabel}>EXERCISES</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{entry.setCount}</Text>
            <Text style={styles.statLabel}>TOTAL SETS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {entry.split.toUpperCase()}
            </Text>
            <Text style={styles.statLabel}>SPLIT</Text>
          </View>
        </View>

        {/* Encouragement */}
        <View style={styles.messageCard}>
          <Text style={styles.messageText}>
            Great session! Consistency is key — keep showing up and the results will follow.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <Pressable
        style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.85 }]}
        onPress={handleDone}
      >
        <Text style={styles.doneBtnText}>Back to Home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: 40,
    gap: spacing.md,
    alignItems: 'center',
    flexGrow: 1,
  },

  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  successEmoji: {
    fontSize: 40,
  },

  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  workoutName: {
    color: colors.secondaryText,
    fontSize: typography.subtitle,
    fontWeight: '600',
  },
  completedDate: {
    color: colors.mutedText,
    fontSize: typography.caption,
    marginBottom: spacing.sm,
  },

  statsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: 6,
    ...shadows.soft,
  },
  statValue: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  statLabel: {
    color: colors.mutedText,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  messageCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  messageText: {
    color: colors.secondaryText,
    fontSize: typography.body,
    lineHeight: 24,
    textAlign: 'center',
  },

  doneBtn: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    minHeight: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lifted,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: '800',
  },
});
