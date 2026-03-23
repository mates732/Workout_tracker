import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ProfileScreen } from '../../features/profile/ProfileScreen';
import { ProgressScreen } from '../../features/progress/ProgressScreen';
import { HomeScreen } from '../../features/home/HomeScreen';
import { colors } from '../../shared/theme/tokens';

export type MainTabsParamList = {
  Workout: undefined;
  Progress: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

const TAB_ICON: Record<keyof MainTabsParamList, keyof typeof Ionicons.glyphMap> = {
  Workout: 'barbell-outline',
  Progress: 'stats-chart-outline',
  Profile: 'person-outline',
};

export function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Workout"
      sceneContainerStyle={{ backgroundColor: colors.background }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 2,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: 14,
          height: 68,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopWidth: 0,
          borderRadius: 22,
          backgroundColor: colors.surfaceStrong,
          elevation: 0,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICON[route.name as keyof MainTabsParamList]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Workout" component={HomeScreen} />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          title: 'Calendar',
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
