import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, AppCard, AppChip, AppInput } from '../../shared/components/ui';
import { useDeviceReader } from '../../shared/device/useDeviceReader';
import { colors, spacing, typography } from '../../shared/theme/tokens';
import {
  loadUserAppSettings,
  saveUserAppSettings,
  type TrainingSplit,
  type UserAppSettings,
} from '../../shared/state/userAppSettingsStore';

const SPLITS: TrainingSplit[] = ['ppl', 'full_body', 'custom'];
const LANGUAGES = ['EN', 'ES', 'DE', 'FR'];

export function ProfileScreen() {
  const [name, setName] = useState('Athlete');
  const [age, setAge] = useState('25');
  const [height, setHeight] = useState('180');
  const [weight, setWeight] = useState('80');
  const [languageIndex, setLanguageIndex] = useState(0);
  const [settings, setSettings] = useState<UserAppSettings | null>(null);
  const { safeAreaPadding, horizontalGutter } = useDeviceReader();

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseReady = Boolean(supabaseUrl && supabaseKey);

  useEffect(() => {
    void loadUserAppSettings().then((value) => {
      setSettings(value);
    });
  }, []);

  const splitLabel = useMemo(() => {
    if (!settings) {
      return 'ppl';
    }

    if (settings.trainingSplit === 'custom') {
      return settings.customSplitName || 'custom';
    }

    return settings.trainingSplit;
  }, [settings]);

  const saveSplit = async (split: TrainingSplit) => {
    if (!settings) {
      return;
    }

    const next = {
      ...settings,
      trainingSplit: split,
    };

    setSettings(next);
    await saveUserAppSettings(next);
  };

  const saveCustomSplitName = async () => {
    if (!settings) {
      return;
    }

    const next = {
      ...settings,
      customSplitName: settings.customSplitName.trim() || 'Custom Session',
    };

    setSettings(next);
    await saveUserAppSettings(next);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { paddingTop: safeAreaPadding.paddingTop, paddingBottom: safeAreaPadding.paddingBottom }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingHorizontal: horizontalGutter }]}>
        <View>
          <Text style={styles.pageTitle}>Profile & App Control</Text>
          <Text style={styles.pageSubtitle}>Comprehensive settings with Supabase backend integration</Text>
        </View>

        <AppCard>
          <Text style={styles.sectionTitle}>Personal Data</Text>
          <AppInput value={name} onChangeText={setName} placeholder="Name" />
          <AppInput value={age} onChangeText={setAge} keyboardType="number-pad" placeholder="Age" />
          <AppInput value={height} onChangeText={setHeight} keyboardType="number-pad" placeholder="Height (cm)" />
          <AppInput value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="Weight (kg)" />
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Training Split</Text>
          <View style={styles.chipsRow}>
            {SPLITS.map((split) => (
              <AppChip
                key={split}
                label={split.replace('_', ' ')}
                selected={settings?.trainingSplit === split}
                onPress={() => void saveSplit(split)}
              />
            ))}
          </View>

          {settings?.trainingSplit === 'custom' ? (
            <>
              <AppInput
                value={settings.customSplitName}
                onChangeText={(value) =>
                  setSettings((current) => (current ? { ...current, customSplitName: value } : current))
                }
                placeholder="Custom split name"
              />
              <AppButton variant="secondary" onPress={() => void saveCustomSplitName()}>
                Save custom split
              </AppButton>
            </>
          ) : null}

          <Text style={styles.metaText}>Current split: {splitLabel}</Text>
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>App Controls</Text>
          <View style={styles.actionsRow}>
            <AppButton style={styles.actionHalf} variant="secondary" onPress={() => setLanguageIndex((current) => (current + 1) % LANGUAGES.length)}>
              Language: {LANGUAGES[languageIndex]}
            </AppButton>
            <AppButton style={styles.actionHalf} variant="secondary" onPress={() => Alert.alert('Theme', 'Black & white theme is active.')}>Theme: Dark</AppButton>
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Supabase Backend</Text>
          <Text style={styles.metaText}>Integrated here instead of a separate connection tab.</Text>
          <Text style={styles.metaText}>URL: {supabaseUrl ? 'Configured' : 'Missing EXPO_PUBLIC_SUPABASE_URL'}</Text>
          <Text style={styles.metaText}>Publishable Key: {supabaseKey ? 'Configured' : 'Missing EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY'}</Text>
          <AppButton variant={supabaseReady ? 'primary' : 'secondary'} onPress={() => Alert.alert('Supabase', supabaseReady ? 'Supabase environment is configured.' : 'Set Supabase env vars to enable backend sync.') }>
            {supabaseReady ? 'Supabase Connected' : 'Supabase Setup Needed'}
          </AppButton>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 110,
  },
  pageTitle: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '700',
  },
  pageSubtitle: {
    marginTop: 2,
    color: colors.mutedText,
    fontSize: typography.body,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  metaText: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionHalf: {
    flex: 1,
  },
});
