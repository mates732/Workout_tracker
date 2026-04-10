import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabs } from './MainTabs';
import ActiveWorkoutScreen from '../features/workout/ActiveWorkoutScreen';
import { CalendarScreen } from '../features/calendar/CalendarScreen';
import { WorkoutSummaryScreen } from '../features/workout/WorkoutSummaryScreen';
import type { WorkoutHistoryEntry } from '../types/workout';

export type RootStackParamList = {
  MainTabs: undefined;
  ActiveWorkout: { workoutId?: string } | undefined;
  Calendar: undefined;
  WorkoutSummary: { entry: WorkoutHistoryEntry };
};

const Stack = createNativeStackNavigator<RootStackParamList, undefined>();

export function RootNavigator() {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="ActiveWorkout"
        component={ActiveWorkoutScreen}
        options={{ animation: 'fade_from_bottom', gestureEnabled: false }}
      />
      <Stack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="WorkoutSummary"
        component={WorkoutSummaryScreen}
        options={{ animation: 'fade_from_bottom', gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
