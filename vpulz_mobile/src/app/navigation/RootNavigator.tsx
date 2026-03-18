import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabs } from './MainTabs';
import { ActiveWorkoutScreen } from '../../features/workout/ActiveWorkoutScreen';
import { WorkoutSummaryScreen } from '../../features/workout/WorkoutSummaryScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  ActiveWorkout: undefined;
  WorkoutSummary: {
    durationMinutes: number;
    totalVolume: number;
    totalSets: number;
    personalRecord: string | null;
    insight: string | null;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="ActiveWorkout"
        component={ActiveWorkoutScreen}
        options={{ animation: 'fade_from_bottom' }}
      />
      <Stack.Screen
        name="WorkoutSummary"
        component={WorkoutSummaryScreen}
        options={{ animation: 'fade_from_bottom' }}
      />
    </Stack.Navigator>
  );
}
