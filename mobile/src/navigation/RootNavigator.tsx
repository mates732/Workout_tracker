import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import WorkoutListScreen from '../screens/WorkoutListScreen';
import WorkoutDetailScreen from '../screens/WorkoutDetailScreen';
import LogWorkoutScreen from '../screens/LogWorkoutScreen';
import WorkoutHistoryScreen from '../screens/WorkoutHistoryScreen';
import { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function WorkoutsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="WorkoutList" component={WorkoutListScreen} options={{ title: 'Workouts' }} />
      <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} options={{ title: 'Workout Detail' }} />
      <Stack.Screen name="LogWorkout" component={LogWorkoutScreen} options={{ title: 'Log Workout' }} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Workouts" component={WorkoutsStack} options={{ headerShown: false, title: 'Workouts' }} />
      <Tab.Screen name="WorkoutHistory" component={WorkoutHistoryScreen} options={{ title: 'History' }} />
    </Tab.Navigator>
  );
}
