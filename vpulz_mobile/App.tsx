import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from './src/app/navigation/RootNavigator';
import { WorkoutFlowProvider } from './src/shared/state/WorkoutFlowContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <WorkoutFlowProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </WorkoutFlowProvider>
    </GestureHandlerRootView>
  );
}
