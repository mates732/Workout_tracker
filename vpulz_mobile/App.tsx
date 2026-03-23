import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/app/navigation/RootNavigator';
import type { RootStackParamList } from './src/app/navigation/RootNavigator';
import { MinimizedWorkoutBar } from './src/features/workout/MinimizedWorkoutBar';
import { WorkoutFlowProvider, useWorkoutFlow } from './src/shared/state/WorkoutFlowContext';

const navigationRef = createNavigationContainerRef<RootStackParamList>();

function AppShell() {
  const { isInitializing } = useWorkoutFlow();

  if (isInitializing) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color="#000" />
        <Text style={styles.loadingText}>Preparing workout session...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="light" />
      <RootNavigator />
      <MinimizedWorkoutBar
        onPress={() => {
          if (!navigationRef.isReady()) {
            return;
          }
          navigationRef.navigate('ActiveWorkout');
        }}
      />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <WorkoutFlowProvider>
          <AppShell />
        </WorkoutFlowProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    gap: 10,
  },
  loadingText: {
    color: '#111',
    fontSize: 14,
    fontWeight: '600',
  },
});
