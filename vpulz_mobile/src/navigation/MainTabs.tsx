import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../features/home/Home';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { TrainingScreen } from '../features/training/TrainingScreen';
import { colors } from '../shared/theme/tokens';

export type MainTabsParamList = {
  Home: undefined;
  Training: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList, undefined>();

const TAB_ICON: Record<keyof MainTabsParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home-outline',
  Training: 'barbell-outline',
  Settings: 'settings-outline',
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
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 2,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 16,
          height: 72,
          paddingTop: 8,
          paddingBottom: 8,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 24,
          backgroundColor: colors.surface,
          elevation: 0,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICON[route.name as keyof MainTabsParamList]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Training" component={TrainingScreen} />
      <Tab.Screen
        name="Settings"
        component={ProfileScreen}
        options={{
          title: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}
