import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import HomeScreen from "../screens/HomeScreen";

export type RootStackParamList = {
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList, undefined>();

export default function AppNavigator(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator id={undefined}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Workout Tracker" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
