import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsHomeScreen } from './screens/SettingsHomeScreen';
import { ProfileSettingsScreen } from './screens/ProfileSettingsScreen';
import { AppSettingsScreen } from './screens/AppSettingsScreen';
import { PrivacySecurityScreen } from './screens/PrivacySecurityScreen';
import { useSettings } from './state/SettingsContext';
import WorkoutLoggerScreen from '../workout/WorkoutLoggerScreen';
import { AddExerciseScreen } from '../workout/AddExerciseScreen';

export type SettingsStackParamList = {
  SettingsHome: undefined;
  ProfileSettings: undefined;
  AppSettings: undefined;
  PrivacySecuritySettings: undefined;
  WorkoutSession: undefined;
  AddExercise: { autoOpenLogger?: boolean } | undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsNavigator() {
  const { colors } = useSettings();

  return (
    <Stack.Navigator
      initialRouteName="SettingsHome"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="SettingsHome" component={SettingsHomeScreen} />
      <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
      <Stack.Screen name="AppSettings" component={AppSettingsScreen} />
      <Stack.Screen name="PrivacySecuritySettings" component={PrivacySecurityScreen} />
      <Stack.Screen name="WorkoutSession" component={WorkoutLoggerScreen} />
      <Stack.Screen name="AddExercise" component={AddExerciseScreen} />
    </Stack.Navigator>
  );
}
