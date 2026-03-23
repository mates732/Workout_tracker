import { useEffect, useMemo, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ProgressResponse } from '../../shared/api/workoutApi';
import { AppButton, AppCard } from '../../shared/components/ui';
import { useDeviceReader } from '../../shared/device/useDeviceReader';
import { useWorkoutFlow } from '../../shared/state/WorkoutFlowContext';
import { colors, radius, spacing, typography } from '../../shared/theme/tokens';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';

type ExerciseDetailRouteProp = RouteProp<RootStackParamList, 'ExerciseDetail'>;
type ExerciseDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ExerciseDetail'>;

function mockProgress(exerciseName: string): ProgressResponse {
  const base = Date.now() - 5 * 24 * 60 * 60 * 1000;
  const weight = [20, 22.5, 25, 27.5, 30, 32.5];
  const volume = [640, 720, 810, 920, 1040, 1190];

  return {
    exercise_id: 0,
    exercise_name: exerciseName,
    user_id: 'u1',
    weight_over_time: weight.map((value, index) => ({
      timestamp: new Date(base + index * 24 * 60 * 60 * 1000).toISOString(),
      weight: value,
    })),
    volume_trend: volume.map((value, index) => ({
      timestamp: new Date(base + index * 24 * 60 * 60 * 1000).toISOString(),
      volume: value,
    })),
  };
}

function mediaForExercise(exerciseName: string): string {
  const key = exerciseName.toLowerCase();
  if (key.includes('bench')) {
    return 'https://i.gifer.com/7VE.gif';
  }
  if (key.includes('squat')) {
    return 'https://i.gifer.com/7plQ.gif';
  }
  return 'https://i.gifer.com/3M9b.gif';
}

export function ExerciseDetailScreen() {
  const navigation = useNavigation<ExerciseDetailNavigationProp>();
  const route = useRoute<ExerciseDetailRouteProp>();
  const { loadExerciseProgress } = useWorkoutFlow();
  const { safeAreaPadding, horizontalGutter } = useDeviceReader();

  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const exercise = route.params.exercise;
  const mediaUrl = exercise.image_url || exercise.image_urls?.[0] || mediaForExercise(exercise.name);
  const videoUrl = exercise.video_url || exercise.video_urls?.[0] || null;

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      try {
        const real = await loadExerciseProgress(exercise.id);
        if (mounted) {
          setProgress(real);
        }
      } catch {
        if (mounted) {
          setProgress(mockProgress(exercise.name));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [exercise.id, exercise.name, loadExerciseProgress]);

  const historyRows = useMemo(() => {
    if (!progress?.weight_over_time.length) {
      return [];
    }

    return progress.weight_over_time
      .slice(-6)
      .reverse()
      .map((item, index) => ({
        date: new Date(item.timestamp).toLocaleDateString(),
        weight: item.weight,
        volume: progress.volume_trend.at(-(index + 1))?.volume ?? null,
      }));
  }, [progress]);

  const weightMax = Math.max(1, ...(progress?.weight_over_time.map((item) => item.weight) ?? [1]));
  const volumeMax = Math.max(1, ...(progress?.volume_trend.map((item) => item.volume) ?? [1]));

  return (
    <SafeAreaView
      style={[styles.safeArea, { paddingTop: safeAreaPadding.paddingTop, paddingBottom: safeAreaPadding.paddingBottom }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <View style={[styles.container, { paddingHorizontal: horizontalGutter }]}>
        <View style={styles.topRow}>
          <Text style={styles.title}>{exercise.name}</Text>
          <AppButton variant="secondary" onPress={() => navigation.goBack()}>
            Back
          </AppButton>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppCard>
            <Text style={styles.sectionTitle}>Muscle Groups</Text>
            <Text style={styles.sectionBody}>{exercise.muscle_group}</Text>
            <Text style={styles.sectionMeta}>Equipment: {exercise.equipment}</Text>
          </AppCard>

          <AppCard>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <Text style={styles.sectionBody}>{exercise.instructions || 'No instructions available yet.'}</Text>
          </AppCard>

          <AppCard>
            <Text style={styles.sectionTitle}>Demo GIF / Video</Text>
            <Image source={{ uri: mediaUrl }} style={styles.media} resizeMode="cover" />
            {videoUrl ? (
              <Pressable style={styles.videoButton} onPress={() => void Linking.openURL(videoUrl)}>
                <Text style={styles.videoButtonText}>Open Video</Text>
              </Pressable>
            ) : (
              <Text style={styles.sectionMeta}>No video provided for this exercise.</Text>
            )}
          </AppCard>

          <AppCard>
            <Text style={styles.sectionTitle}>Previous History</Text>
            {loading ? <Text style={styles.sectionMeta}>Loading history...</Text> : null}
            {historyRows.length ? (
              historyRows.map((row) => (
                <View key={`${row.date}-${row.weight}`} style={styles.historyRow}>
                  <Text style={styles.historyDate}>{row.date}</Text>
                  <Text style={styles.historyValue}>{row.weight} kg</Text>
                  <Text style={styles.historyValue}>{row.volume ?? 0} vol</Text>
                </View>
              ))
            ) : (
              <Text style={styles.sectionMeta}>No history found yet.</Text>
            )}
          </AppCard>

          <AppCard>
            <Text style={styles.sectionTitle}>Progress Tracking</Text>
            <Text style={styles.sectionMeta}>Weight trend</Text>
            {(progress?.weight_over_time ?? []).slice(-6).map((item) => (
              <View key={item.timestamp} style={styles.barRow}>
                <Text style={styles.barLabel}>{new Date(item.timestamp).toLocaleDateString()}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${Math.max(8, (item.weight / weightMax) * 100)}%` }]} />
                </View>
                <Text style={styles.barValue}>{item.weight}kg</Text>
              </View>
            ))}

            <Text style={[styles.sectionMeta, styles.progressGap]}>Volume trend</Text>
            {(progress?.volume_trend ?? []).slice(-6).map((item) => (
              <View key={item.timestamp} style={styles.barRow}>
                <Text style={styles.barLabel}>{new Date(item.timestamp).toLocaleDateString()}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFillSecondary, { width: `${Math.max(8, (item.volume / volumeMax) * 100)}%` }]} />
                </View>
                <Text style={styles.barValue}>{Math.round(item.volume)}</Text>
              </View>
            ))}
          </AppCard>
        </ScrollView>
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
    paddingTop: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '700',
  },
  content: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  sectionBody: {
    marginTop: 6,
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
  },
  sectionMeta: {
    marginTop: 6,
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  media: {
    marginTop: spacing.sm,
    width: '100%',
    height: 220,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated,
  },
  videoButton: {
    marginTop: spacing.sm,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceStrong,
  },
  videoButtonText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  historyRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  historyDate: {
    color: colors.mutedText,
    fontSize: typography.caption,
    flex: 1,
  },
  historyValue: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '700',
    minWidth: 70,
    textAlign: 'right',
  },
  barRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabel: {
    width: 76,
    color: colors.mutedText,
    fontSize: typography.tiny,
  },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  barFillSecondary: {
    height: '100%',
    backgroundColor: colors.mutedText,
  },
  barValue: {
    minWidth: 52,
    textAlign: 'right',
    color: colors.text,
    fontSize: typography.tiny,
    fontWeight: '700',
  },
  progressGap: {
    marginTop: spacing.md,
  },
});
