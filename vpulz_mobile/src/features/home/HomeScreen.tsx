import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { MainTabsParamList } from '../../app/navigation/MainTabs';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';
import { PressableScale } from '../../shared/animations/PressableScale';
import { useDeviceReader } from '../../shared/device/useDeviceReader';
import { useWorkoutFlow } from '../../shared/state/WorkoutFlowContext';
import { colors, radius, spacing, typography } from '../../shared/theme/tokens';

type HomeNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList, 'Workout'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const { startOrResumeWorkout, busy } = useWorkoutFlow();
  const { safeAreaPadding, horizontalGutter } = useDeviceReader();

  const onStartWorkout = async () => {
    try {
      await startOrResumeWorkout();
      navigation.navigate('ActiveWorkout');
    } catch {
      // WorkoutFlowContext exposes error state globally.
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: safeAreaPadding.paddingTop }]}
      edges={['top', 'left', 'right']}>
      <View style={[styles.container, { paddingHorizontal: horizontalGutter }]}>
        <Text style={styles.title}>Quick Start</Text>
        <Text style={styles.subtitle}>Start your workout instantly and manage your month calendar.</Text>
        <PressableScale style={styles.button} onPress={() => void onStartWorkout()} disabled={busy}>
          {busy ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={styles.buttonText}>Start Workout</Text>
          )}
        </PressableScale>
        <PressableScale style={styles.secondaryButton} onPress={() => navigation.navigate('Progress')}>
          <Text style={styles.secondaryButtonText}>Open Calendar</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: typography.body,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.sm,
    height: 50,
    minWidth: 220,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: colors.primaryText,
    fontSize: typography.body,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 46,
    minWidth: 220,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
  },
});
