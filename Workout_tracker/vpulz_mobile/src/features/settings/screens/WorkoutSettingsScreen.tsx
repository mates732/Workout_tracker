import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SettingsScaffold } from '../components/SettingsScaffold';
import { useSettings } from '../state/SettingsContext';

export function WorkoutSettingsScreen() {
  const { settings, updateSettings, isPremiumFeatureAvailable, t, colors, requestDeleteAccount } = useSettings();

  const languageCycle = ['en', 'es', 'de', 'fr'] as const;
  const currentLanguageIndex = languageCycle.indexOf(settings.app.language);
  const nextLanguage = languageCycle[(currentLanguageIndex + 1) % languageCycle.length];

  return (
    <SettingsScaffold title="SETTINGS" subtitle="Profile & app control center">
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PROFILE</Text>
      <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Text style={[styles.avatarLabel, { color: colors.text }]}>{(settings.profile.name || 'A').slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={styles.profileTextWrap}>
            <Text style={[styles.profileName, { color: colors.text }]}>{settings.profile.name || 'ATHLETE'}</Text>
            <Text style={[styles.profileMeta, { color: colors.textMuted }]}>PRO MEMBER • SINCE 2023</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>APP SETTINGS</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>APPEARANCE</Text>
          <Pressable
            style={[styles.modeToggle, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
            onPress={() =>
              updateSettings((current) => ({
                ...current,
                app: { ...current.app, themeMode: current.app.themeMode === 'dark' ? 'light' : 'dark' },
              }))
            }
          >
            <Text style={[styles.modeActive, { color: colors.background }]}>{settings.app.themeMode.toUpperCase()}</Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.settingRow, { borderBottomColor: colors.border }]}
          onPress={() =>
            updateSettings((current) => ({
              ...current,
              app: { ...current.app, language: nextLanguage },
            }))
          }
        >
          <Text style={[styles.rowLabel, { color: colors.text }]}>LANGUAGE</Text>
          <Text style={[styles.rowValue, { color: colors.textMuted }]}>{settings.app.language.toUpperCase()}</Text>
        </Pressable>

        <Pressable
          style={styles.settingRow}
          onPress={() =>
            updateSettings((current) => ({
              ...current,
              workout: { ...current.workout, units: current.workout.units === 'kg' ? 'lbs' : 'kg' },
            }))
          }
        >
          <Text style={[styles.rowLabel, { color: colors.text }]}>UNITS</Text>
          <Text style={[styles.rowValue, { color: colors.textMuted }]}>{settings.workout.units.toUpperCase()}</Text>
        </Pressable>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>WORKOUT</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <Pressable
          style={[styles.settingRow, { borderBottomColor: colors.border }]}
          onPress={() => {
            const cycle = [60, 90, 120, 180];
            const currentIndex = cycle.indexOf(settings.workout.defaultRestTimerSec);
            const next = cycle[(currentIndex + 1) % cycle.length];
            updateSettings((current) => ({ ...current, workout: { ...current.workout, defaultRestTimerSec: next } }));
          }}
        >
          <Text style={[styles.rowLabel, { color: colors.text }]}>{t('defaultRestTimer').toUpperCase()}</Text>
          <Text style={[styles.rowValue, { color: colors.textMuted }]}>{settings.workout.defaultRestTimerSec}s</Text>
        </Pressable>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}> 
          <Text style={[styles.rowLabel, { color: colors.text }]}>{t('autoStartRestTimer').toUpperCase()}</Text>
          <Switch
            value={settings.workout.autoStartRestTimer}
            onValueChange={(value) => updateSettings((current) => ({ ...current, workout: { ...current.workout, autoStartRestTimer: value } }))}
            trackColor={{ true: '#3A3A3A', false: colors.border }}
            thumbColor={colors.text}
          />
        </View>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}> 
          <Text style={[styles.rowLabel, { color: colors.text }]}>{t('autoSaveWorkouts').toUpperCase()}</Text>
          <Switch
            value={settings.workout.autoSaveWorkouts}
            onValueChange={(value) => updateSettings((current) => ({ ...current, workout: { ...current.workout, autoSaveWorkouts: value } }))}
            trackColor={{ true: '#3A3A3A', false: colors.border }}
            thumbColor={colors.text}
          />
        </View>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}> 
          <Text style={[styles.rowLabel, { color: colors.text }]}>{t('warmupSets').toUpperCase()}</Text>
          <Switch
            value={settings.workout.warmupSetsEnabled}
            onValueChange={(value) => updateSettings((current) => ({ ...current, workout: { ...current.workout, warmupSetsEnabled: value } }))}
            trackColor={{ true: '#3A3A3A', false: colors.border }}
            thumbColor={colors.text}
          />
        </View>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}> 
          <Text style={[styles.rowLabel, { color: colors.text }]}>{t('prTracking').toUpperCase()}</Text>
          <Switch
            value={settings.workout.prTrackingEnabled}
            onValueChange={(value) => updateSettings((current) => ({ ...current, workout: { ...current.workout, prTrackingEnabled: value } }))}
            trackColor={{ true: '#3A3A3A', false: colors.border }}
            thumbColor={colors.text}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>{t('adaptiveRestTimer').toUpperCase()}</Text>
          <Switch
            value={settings.workout.adaptiveRestTimerEnabled}
            onValueChange={(value) => {
              if (!isPremiumFeatureAvailable('adaptive-rest-timer')) {
                return;
              }
              updateSettings((current) => ({ ...current, workout: { ...current.workout, adaptiveRestTimerEnabled: value } }));
            }}
            trackColor={{ true: '#3A3A3A', false: colors.border }}
            thumbColor={colors.text}
          />
        </View>
      </View>

      {!isPremiumFeatureAvailable('adaptive-rest-timer') ? (
        <View style={[styles.premiumCallout, { borderColor: '#3A2B10', backgroundColor: '#2A1D07' }]}>
          <Text style={styles.premiumText}>{t('premiumAdaptiveRestHint')}</Text>
        </View>
      ) : null}

      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PRIVACY & SECURITY</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <Pressable style={[styles.settingRow, { borderBottomColor: colors.border }]}> 
          <Text style={[styles.rowLabel, { color: colors.text }]}>CHANGE PASSWORD</Text>
          <Text style={[styles.rowValue, { color: colors.textMuted }]}>›</Text>
        </Pressable>
        <Pressable style={[styles.deleteRow, { backgroundColor: colors.surfaceAlt }]} onPress={requestDeleteAccount}>
          <Text style={styles.deleteLabel}>DELETE ACCOUNT</Text>
          <Text style={styles.deleteLabel}>!</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.aiHookRow, { borderColor: colors.border, backgroundColor: colors.background }]}
        onPress={() =>
          updateSettings((current) => ({
            ...current,
            smart: { ...current.smart, aiWorkoutPreferencesEnabled: !current.smart.aiWorkoutPreferencesEnabled },
          }))
        }
      >
        <Text style={[styles.aiHookText, { color: colors.textMuted }]}>
          {t('aiWorkoutPreferences').toUpperCase()}: {settings.smart.aiWorkoutPreferencesEnabled ? t('enabled').toUpperCase() : t('disabled').toUpperCase()}
        </Text>
      </Pressable>
    </SettingsScaffold>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  profileCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    fontSize: 22,
    fontWeight: '700',
  },
  profileTextWrap: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  profileMeta: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  settingRow: {
    minHeight: 54,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  rowValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  modeToggle: {
    minHeight: 28,
    minWidth: 72,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeActive: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  premiumCallout: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
  },
  premiumText: {
    color: '#FFDFA7',
    fontSize: 12,
  },
  aiHookRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  deleteRow: {
    minHeight: 56,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deleteLabel: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  aiHookText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
