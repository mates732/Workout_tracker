import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../features/home/Home';
import { CalendarScreen } from '../features/calendar/CalendarScreen';
import { colors, radius } from '../shared/theme/tokens';

export type MainTabsParamList = {
  Home: undefined;
  CalendarTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList, undefined>();

const TAB_ICON: Record<keyof MainTabsParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home-outline',
  CalendarTab: 'calendar-outline',
};

export function MainTabs() {
  return (
    <Tab.Navigator
      id={undefined}
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        sceneStyle: { backgroundColor: colors.background },
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginBottom: 2,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: 20,
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.xl,
          backgroundColor: colors.surface,
          elevation: 0,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICON[route.name as keyof MainTabsParamList]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="CalendarTab"
        component={CalendarScreen}
        options={{ title: 'Calendar' }}
      />
    </Tab.Navigator>
  );
}
