import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../../features/home/HomeScreen';
import { WorkoutScreen } from '../../features/workout/WorkoutScreen';
import { ProgressScreen } from '../../features/progress/ProgressScreen';
import { ProfileScreen } from '../../features/profile/ProfileScreen';

export type MainTabsParamList = {
  Home: undefined;
  Workout: undefined;
  Progress: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Workout" component={WorkoutScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
