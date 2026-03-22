import { Alert } from 'react-native';
import { SettingsCard } from '../components/SettingsCard';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsScaffold } from '../components/SettingsScaffold';
import { useSettings } from '../state/SettingsContext';

export function PrivacySecurityScreen() {
  const { settings, requestDeleteAccount, t } = useSettings();

  return (
    <SettingsScaffold title={t('privacySecurity')} subtitle={t('privacySubtitle')}>
      <SettingsCard>
        <SettingsRow
          label={t('deleteAccount')}
          value={settings.privacy.deleteAccountRequested ? t('requested') : t('notRequested')}
          onPress={() => {
            requestDeleteAccount();
            Alert.alert('Delete account', 'Delete account request placeholder submitted.');
          }}
        />
      </SettingsCard>
    </SettingsScaffold>
  );
}
