import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabs } from './MainTabs';
import type { MainTabsParamList } from './MainTabs';
import ActiveWorkoutScreen from '../features/workout/ActiveWorkoutScreen';
import { ExerciseLibraryScreen } from '../features/workout/ExerciseLibraryScreen';
import { WorkoutSummaryScreen } from '../features/workout/WorkoutSummaryScreen';
import { CalendarScreen } from '../features/calendar/CalendarScreen';
import type { AdaptiveWorkoutPlan, LastWorkoutSummary } from '../shared/state/settingsLogic';

export type RootStackParamList = {
  MainTabs: { screen?: keyof MainTabsParamList } | undefined;
  ActiveWorkout: { workoutId?: string } | undefined;
  ExerciseLibrary: undefined;
  PreviewDemo: undefined;
  Calendar: undefined;
  WorkoutSummary: {
    summary: LastWorkoutSummary;
    nextPlan: AdaptiveWorkoutPlan | null;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList, undefined>();

export function RootNavigator() {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="ExerciseLibrary" component={ExerciseLibraryScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="PreviewDemo" component={require('../features/training/WorkoutPreviewDemoScreen').WorkoutPreviewDemoScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen
        name="ActiveWorkout"
        component={ActiveWorkoutScreen}
        options={{ animation: 'fade_from_bottom' }}
      />
      <Stack.Screen name="Calendar" component={CalendarScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen
        name="WorkoutSummary"
        component={WorkoutSummaryScreen}
        options={{ animation: 'fade_from_bottom' }}
      />
    </Stack.Navigator>
  );
}
