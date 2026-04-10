import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { WorkoutLoggerProvider } from "../state/WorkoutLoggerContext";
import CalendarScreen from "../screens/CalendarScreen";
import ExerciseLibraryScreen from "../screens/ExerciseLibraryScreen";
import WorkoutLoggerScreen from "../screens/WorkoutLoggerScreen";
import WorkoutSessionScreen from "../screens/WorkoutSessionScreen";

export type RootStackParamList = {
  Home: undefined;
  Workout: undefined;
  Calendar: undefined;
  ExerciseLibrary: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator(): React.JSX.Element {
  return (
    <WorkoutLoggerProvider>
      <NavigationContainer>
        <Stack.Navigator
          id={undefined}
          screenOptions={{
            headerStyle: { backgroundColor: "#0F0F14" },
            headerTintColor: "#F0EEFF",
            headerShadowVisible: false,
            contentStyle: { backgroundColor: "#0B0B0F" },
          }}
        >
          <Stack.Screen
            name="Home"
            component={WorkoutLoggerScreen}
            options={{ title: "Workout Tracker" }}
          />
          <Stack.Screen
            name="Workout"
            component={WorkoutSessionScreen}
            options={{ title: "Workout" }}
          />
          <Stack.Screen
            name="Calendar"
            component={CalendarScreen}
            options={{ title: "Calendar" }}
          />
          <Stack.Screen
            name="ExerciseLibrary"
            component={ExerciseLibraryScreen}
            options={{ title: "Exercise Library" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </WorkoutLoggerProvider>
  );
}
