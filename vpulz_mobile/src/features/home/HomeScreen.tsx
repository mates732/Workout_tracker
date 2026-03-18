import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import type { MainTabsParamList } from '../../app/navigation/MainTabs';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';
import { PressableScale } from '../../shared/animations/PressableScale';
import { colors, radius, spacing, typography } from '../../shared/theme/tokens';

type HomeNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList, 'Workout'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Quick Start</Text>
        <Text style={styles.subtitle}>The main workflow is now in the Workout tab.</Text>
        <PressableScale style={styles.button} onPress={() => navigation.navigate('ActiveWorkout')}>
          <Text style={styles.buttonText}>Open Active Workout</Text>
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
});
