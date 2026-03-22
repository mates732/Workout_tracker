import { Pressable, StyleSheet, Text, View } from 'react-native';
import { listPremiumFeatures } from '../services/premiumService';
import { SettingsCard } from '../components/SettingsCard';
import { SettingsScaffold } from '../components/SettingsScaffold';
import { useSettings } from '../state/SettingsContext';

export function PremiumScreen() {
  const { settings, updateSettings } = useSettings();
  const features = listPremiumFeatures();

  return (
    <SettingsScaffold title="Premium" subtitle="Subscription and feature gating">
      <SettingsCard>
        <Text style={styles.tierLabel}>Current Tier: {settings.premium.tier.toUpperCase()}</Text>
        <Pressable
          style={styles.upgradeButton}
          onPress={() =>
            updateSettings((current) => ({
              ...current,
              premium: { tier: current.premium.tier === 'free' ? 'premium' : 'free' },
            }))
          }
        >
          <Text style={styles.upgradeButtonText}>{settings.premium.tier === 'free' ? 'Upgrade (placeholder)' : 'Downgrade (placeholder)'}</Text>
        </Pressable>
      </SettingsCard>

      <SettingsCard>
        {features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <Text style={styles.featureText}>{feature}</Text>
            <Text style={styles.featureState}>{settings.premium.tier === 'premium' ? 'Unlocked' : 'Locked'}</Text>
          </View>
        ))}
      </SettingsCard>
    </SettingsScaffold>
  );
}

const styles = StyleSheet.create({
  tierLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  upgradeButton: {
    marginTop: 8,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeButtonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 14,
  },
  featureRow: {
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#232323',
  },
  featureText: {
    color: '#DBDBDB',
    fontSize: 13,
  },
  featureState: {
    color: '#B6B6B6',
    fontSize: 12,
  },
});
