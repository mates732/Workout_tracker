import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useWorkoutStore, getElapsedSeconds, formatDuration } from '../../store/workoutStore';
import { colors, radius, shadows, spacing, typography } from '../../shared/theme/tokens';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const activeWorkoutId = useWorkoutStore((s) => s.activeWorkoutId);
  const sessionStartedAt = useWorkoutStore((s) => s.sessionStartedAt);
  const history = useWorkoutStore((s) => s.history);
  const workouts = useWorkoutStore((s) => s.workouts);
  const createWorkout = useWorkoutStore((s) => s.createWorkout);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);

  const [elapsed, setElapsed] = useState(() => getElapsedSeconds(sessionStartedAt));

  useEffect(() => {
    if (!sessionStartedAt) {
      setElapsed(0);
      return;
    }
    setElapsed(getElapsedSeconds(sessionStartedAt));
    const interval = setInterval(() => {
      setElapsed(getElapsedSeconds(sessionStartedAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStartedAt]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const weekStats = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 6);
    cutoff.setHours(0, 0, 0, 0);
    const entries = history.filter((h) => new Date(h.completedAt) >= cutoff);
    const totalSets = entries.reduce((sum, e) => sum + e.setCount, 0);
    const totalMin = entries.reduce((sum, e) => sum + Math.round(e.durationSec / 60), 0);
    return { count: entries.length, totalSets, totalMin };
  }, [history]);

  const lastWorkout = history[0] ?? null;

  const handleStartWorkout = useCallback(() => {
    if (activeWorkoutId) {
      navigation.navigate('ActiveWorkout');
      return;
    }
    const id = createWorkout('Workout');
    startWorkout(id);
    navigation.navigate('ActiveWorkout', { workoutId: id });
  }, [activeWorkoutId, createWorkout, navigation, startWorkout]);

  const handleResumeWorkout = useCallback(() => {
    navigation.navigate('ActiveWorkout');
  }, [navigation]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.appName}>Vpulz</Text>
        </View>

        {/* Active workout banner */}
        {activeWorkoutId && (
          <Pressable style={styles.activeBanner} onPress={handleResumeWorkout}>
            <View style={styles.activeDot} />
            <View style={styles.activeCopy}>
              <Text style={styles.activeLabel}>Workout in progress</Text>
              <Text style={styles.activeTime}>{formatDuration(elapsed)}</Text>
            </View>
            <Text style={styles.activeCaret}>Resume</Text>
          </Pressable>
        )}

        {/* Weekly stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{weekStats.count}</Text>
            <Text style={styles.statLabel}>WORKOUTS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{weekStats.totalSets}</Text>
            <Text style={styles.statLabel}>SETS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{weekStats.totalMin}</Text>
            <Text style={styles.statLabel}>MINUTES</Text>
          </View>
        </View>

        {/* Start Workout CTA */}
        {!activeWorkoutId && (
          <Pressable
            style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaPressed]}
            onPress={handleStartWorkout}
          >
            <Text style={styles.ctaIcon}>+</Text>
            <Text style={styles.ctaText}>Start New Workout</Text>
          </Pressable>
        )}

        {/* Calendar shortcut */}
        <Pressable
          style={({ pressed }) => [styles.calendarCard, pressed && styles.cardPressed]}
          onPress={() => navigation.navigate('Calendar')}
        >
          <Text style={styles.cardIcon}>📅</Text>
          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle}>Calendar</Text>
            <Text style={styles.cardSubtitle}>View your workout history</Text>
          </View>
          <Text style={styles.cardCaret}>›</Text>
        </Pressable>

        {/* Last workout */}
        {lastWorkout && (
          <View style={styles.lastCard}>
            <Text style={styles.sectionTitle}>Last Workout</Text>
            <Text style={styles.lastName}>{lastWorkout.workoutName}</Text>
            <View style={styles.lastStats}>
              <View style={styles.lastStatCell}>
                <Text style={styles.lastStatValue}>{Math.round(lastWorkout.durationSec / 60)}</Text>
                <Text style={styles.lastStatLabel}>min</Text>
              </View>
              <View style={styles.lastStatCell}>
                <Text style={styles.lastStatValue}>{lastWorkout.exerciseCount}</Text>
                <Text style={styles.lastStatLabel}>exercises</Text>
              </View>
              <View style={styles.lastStatCell}>
                <Text style={styles.lastStatValue}>{lastWorkout.setCount}</Text>
                <Text style={styles.lastStatLabel}>sets</Text>
              </View>
            </View>
            <Text style={styles.lastDate}>
              {new Date(lastWorkout.completedAt).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
        )}

        {/* Templates */}
        {workouts.length > 0 && (
          <View style={styles.templatesSection}>
            <Text style={styles.sectionTitle}>Quick Start</Text>
            {workouts.slice(0, 4).map((w) => (
              <Pressable
                key={w.id}
                style={({ pressed }) => [styles.templateRow, pressed && styles.cardPressed]}
                onPress={() => {
                  startWorkout(w.id);
                  navigation.navigate('ActiveWorkout', { workoutId: w.id });
                }}
              >
                <View style={styles.templateInfo}>
                  <Text style={styles.templateName}>{w.name}</Text>
                  <Text style={styles.templateMeta}>
                    {w.exercises.length} exercise{w.exercises.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Text style={styles.templateArrow}>›</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
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
    gap: spacing.md,
  },
  header: {
    paddingTop: spacing.md,
    gap: 2,
  },
  greeting: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  appName: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  // Active banner
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary + '44',
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  activeCopy: {
    flex: 1,
    gap: 2,
  },
  activeLabel: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  activeTime: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  activeCaret: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '800',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    ...shadows.soft,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statLabel: {
    color: colors.mutedText,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  statDivider: {
    width: 1,
    alignSelf: 'center',
    height: '60%',
    backgroundColor: colors.border,
  },

  // CTA
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    ...shadows.lifted,
  },
  ctaPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  ctaIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '300',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // Calendar card
  calendarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: {
    opacity: 0.8,
  },
  cardIcon: {
    fontSize: 28,
  },
  cardCopy: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  cardCaret: {
    color: colors.mutedText,
    fontSize: 22,
    fontWeight: '600',
  },

  // Last workout
  lastCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.mutedText,
    fontSize: typography.tiny,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  lastName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  lastStats: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  lastStatCell: {
    alignItems: 'center',
    gap: 2,
  },
  lastStatValue: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
  },
  lastStatLabel: {
    color: colors.mutedText,
    fontSize: typography.tiny,
    fontWeight: '600',
  },
  lastDate: {
    color: colors.mutedText,
    fontSize: typography.tiny,
  },

  // Templates
  templatesSection: {
    gap: spacing.sm,
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  templateInfo: {
    flex: 1,
    gap: 2,
  },
  templateName: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  templateMeta: {
    color: colors.mutedText,
    fontSize: typography.tiny,
  },
  templateArrow: {
    color: colors.mutedText,
    fontSize: 18,
    fontWeight: '600',
  },
});
