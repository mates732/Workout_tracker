import './src/polyfills/performance';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WorkoutFlowProvider } from './src/shared/state/WorkoutFlowContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import type { RootStackParamList } from './src/navigation/RootNavigator';
import { MinimizedWorkoutBar } from './src/features/workout/MinimizedWorkoutBar';

const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <WorkoutFlowProvider>
          <NavigationContainer ref={navigationRef}>
            <RootNavigator />
            <MinimizedWorkoutBar
              onPress={() => {
                if (navigationRef.isReady()) {
                  navigationRef.navigate('ActiveWorkout');
                }
              }}
            />
          </NavigationContainer>
        </WorkoutFlowProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
