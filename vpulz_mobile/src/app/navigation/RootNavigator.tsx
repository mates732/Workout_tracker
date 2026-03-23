import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabs } from './MainTabs';
import { ActiveWorkoutScreen } from '../../features/workout/ActiveWorkoutScreen';
import { ExerciseDetailScreen } from '../../features/workout/ExerciseDetailScreen';
import { WorkoutSummaryScreen } from '../../features/workout/WorkoutSummaryScreen';
import type { ExerciseItem } from '../../shared/api/workoutApi';

export type RootStackParamList = {
  MainTabs: undefined;
  ActiveWorkout: undefined;
  ExerciseDetail: {
    exercise: ExerciseItem;
  };
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
      <Stack.Screen
        name="ExerciseDetail"
        component={ExerciseDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
