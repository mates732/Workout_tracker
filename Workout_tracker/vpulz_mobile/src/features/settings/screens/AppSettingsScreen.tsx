import { SettingsCard } from '../components/SettingsCard';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsScaffold } from '../components/SettingsScaffold';
import { useSettings } from '../state/SettingsContext';

export function AppSettingsScreen() {
  const { settings, toggleTheme, setLanguage, t } = useSettings();
  const languages = ['en', 'es', 'de', 'fr'] as const;

  return (
    <SettingsScaffold title={t('appSettings')} subtitle={t('appSettingsSubtitle')}>
      <SettingsCard>
        <SettingsRow
          label={t('theme')}
          value={settings.app.themeMode}
          onPress={toggleTheme}
        />
        <SettingsRow
          label={t('language')}
          value={settings.app.language.toUpperCase()}
          onPress={() => {
            const index = languages.indexOf(settings.app.language);
            setLanguage(languages[(index + 1) % languages.length]);
          }}
        />
      </SettingsCard>
    </SettingsScaffold>
  );
}
