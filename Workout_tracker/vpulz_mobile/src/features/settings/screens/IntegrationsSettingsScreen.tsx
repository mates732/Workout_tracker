import { Alert } from 'react-native';
import { connectAppleHealth, connectGoogleFit, syncWearableData } from '../services/integrationsService';
import { SettingsCard } from '../components/SettingsCard';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsScaffold } from '../components/SettingsScaffold';
import { useSettings } from '../state/SettingsContext';

export function IntegrationsSettingsScreen() {
  const { settings, updateSettings } = useSettings();

  return (
    <SettingsScaffold title="Integrations" subtitle="Health platform and wearable connections">
      <SettingsCard>
        <SettingsRow
          label="Apple Health"
          value={settings.integrations.appleHealthConnected ? 'Connected' : 'Not connected'}
          onPress={() => {
            void connectAppleHealth().then((result) => {
              Alert.alert('Apple Health', result.message);
              if (result.connected) {
                updateSettings((current) => ({ ...current, integrations: { ...current.integrations, appleHealthConnected: true } }));
              }
            });
          }}
        />
        <SettingsRow
          label="Google Fit"
          value={settings.integrations.googleFitConnected ? 'Connected' : 'Not connected'}
          onPress={() => {
            void connectGoogleFit().then((result) => {
              Alert.alert('Google Fit', result.message);
              if (result.connected) {
                updateSettings((current) => ({ ...current, integrations: { ...current.integrations, googleFitConnected: true } }));
              }
            });
          }}
        />
        <SettingsRow
          label="Wearable Sync"
          toggleValue={settings.integrations.wearableSyncEnabled}
          onToggleChange={(value) =>
            updateSettings((current) => ({ ...current, integrations: { ...current.integrations, wearableSyncEnabled: value } }))
          }
          helper="Interface ready"
        />
        <SettingsRow
          label="Sync now"
          value="Run placeholder sync"
          onPress={() => {
            void syncWearableData().then((result) => {
              Alert.alert('Wearable Sync', result.message);
            });
          }}
        />
      </SettingsCard>
    </SettingsScaffold>
  );
}
