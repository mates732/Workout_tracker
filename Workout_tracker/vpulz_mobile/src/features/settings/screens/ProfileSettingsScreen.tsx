import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SettingsCard } from '../components/SettingsCard';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsScaffold } from '../components/SettingsScaffold';
import { useSettings } from '../state/SettingsContext';
import { getReusableStyles } from '../../../shared/theme/reusableStyles';
import { useAuth } from '../../../shared/auth/AuthContext';

export function ProfileSettingsScreen() {
  const { settings, updateSettings, colors } = useSettings();
  const { user, signIn, register, signOut } = useAuth();
  const themeStyles = getReusableStyles(colors);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const runAuthAction = async (action: 'signIn' | 'register') => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Auth', 'Email and password are required.');
      return;
    }

    try {
      if (action === 'signIn') {
        await signIn(email.trim(), password);
        Alert.alert('Supabase', 'Signed in successfully.');
        return;
      }

      await register(email.trim(), password);
      Alert.alert('Supabase', 'Registration request sent. Check your inbox if email confirmation is enabled.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed.';
      Alert.alert('Supabase', message);
    }
  };

  return (
    <SettingsScaffold title="PROFILE" subtitle="Identity, account and backend access">
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ATHLETE</Text>
      <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <View style={[styles.avatar, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Text style={[styles.avatarText, { color: colors.text }]}>{(settings.profile.name || 'A').slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={styles.heroTextWrap}>
          <Text style={[styles.heroName, { color: colors.text }]}>{(settings.profile.name || 'ATHLETE').toUpperCase()}</Text>
          <Text style={[styles.heroMeta, { color: colors.textMuted }]}>PRO MEMBER • SINCE 2023</Text>
        </View>
      </View>

      <SettingsCard>
        <SettingsRow label="Profile" value={settings.profile.name || 'Athlete'} helper="Core identity and baseline metrics" />
        <TextInput style={themeStyles.input} placeholder="Name" placeholderTextColor={colors.textMuted} value={settings.profile.name} onChangeText={(value) => updateSettings((current) => ({ ...current, profile: { ...current.profile, name: value } }))} />
        <TextInput style={themeStyles.input} placeholder="Age" placeholderTextColor={colors.textMuted} value={settings.profile.age} keyboardType="number-pad" onChangeText={(value) => updateSettings((current) => ({ ...current, profile: { ...current.profile, age: value } }))} />
        <TextInput style={themeStyles.input} placeholder="Height (cm)" placeholderTextColor={colors.textMuted} value={settings.profile.heightCm} keyboardType="decimal-pad" onChangeText={(value) => updateSettings((current) => ({ ...current, profile: { ...current.profile, heightCm: value } }))} />
        <TextInput style={themeStyles.input} placeholder="Weight" placeholderTextColor={colors.textMuted} value={settings.profile.weightKg} keyboardType="decimal-pad" onChangeText={(value) => updateSettings((current) => ({ ...current, profile: { ...current.profile, weightKg: value } }))} />
        <TextInput style={themeStyles.input} placeholder="Gender" placeholderTextColor={colors.textMuted} value={settings.profile.gender} onChangeText={(value) => updateSettings((current) => ({ ...current, profile: { ...current.profile, gender: value } }))} />
        <TextInput style={themeStyles.input} placeholder="Fitness Level" placeholderTextColor={colors.textMuted} value={settings.profile.fitnessLevel} onChangeText={(value) => updateSettings((current) => ({ ...current, profile: { ...current.profile, fitnessLevel: value } }))} />
        <TextInput style={themeStyles.input} placeholder="Profile image URL" placeholderTextColor={colors.textMuted} value={settings.profile.profileImageUrl} onChangeText={(value) => updateSettings((current) => ({ ...current, profile: { ...current.profile, profileImageUrl: value } }))} />
      </SettingsCard>

      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>WORKOUT DEFAULTS</Text>
      <SettingsCard>
        <SettingsRow label="Workout Defaults" value={`${settings.workout.units.toUpperCase()} · ${settings.workout.defaultRestTimerSec}s rest`} />
        <SettingsRow
          label="Units"
          value={settings.workout.units.toUpperCase()}
          onPress={() =>
            updateSettings((current) => ({
              ...current,
              workout: { ...current.workout, units: current.workout.units === 'kg' ? 'lbs' : 'kg' },
            }))
          }
        />
        <SettingsRow
          label="Auto-save workouts"
          toggleValue={settings.workout.autoSaveWorkouts}
          onToggleChange={(value) => updateSettings((current) => ({ ...current, workout: { ...current.workout, autoSaveWorkouts: value } }))}
        />
        <SettingsRow
          label="Theme mode"
          value={settings.app.themeMode}
          onPress={() =>
            updateSettings((current) => ({
              ...current,
              app: { ...current.app, themeMode: current.app.themeMode === 'dark' ? 'light' : 'dark' },
            }))
          }
        />
      </SettingsCard>

      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SUPABASE BACKEND</Text>
      <SettingsCard>
        <SettingsRow
          label="Supabase Backend"
          value={user?.email ?? 'Not connected'}
          helper="Integrated here instead of a separate connection tab"
        />

        <TextInput
          style={themeStyles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Supabase email"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={colors.textMuted}
        />
        <TextInput
          style={themeStyles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Supabase password"
          secureTextEntry
          placeholderTextColor={colors.textMuted}
        />

        <View style={styles.authButtons}>
          <Pressable style={styles.primaryButton} onPress={() => void runAuthAction('signIn')}>
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => void runAuthAction('register')}>
            <Text style={styles.secondaryButtonText}>Register</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => void signOut()}>
            <Text style={styles.secondaryButtonText}>Sign Out</Text>
          </Pressable>
        </View>
      </SettingsCard>
    </SettingsScaffold>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  heroTextWrap: {
    flex: 1,
    gap: 2,
  },
  heroName: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  heroMeta: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  authButtons: {
    gap: 8,
  },
  primaryButton: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2B2B2B',
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
