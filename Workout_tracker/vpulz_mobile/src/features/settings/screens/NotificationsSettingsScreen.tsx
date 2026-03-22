import { SettingsCard } from '../components/SettingsCard';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsScaffold } from '../components/SettingsScaffold';
import { useSettings } from '../state/SettingsContext';

export function NotificationsSettingsScreen() {
  const { settings, updateSettings } = useSettings();

  return (
    <SettingsScaffold title="Notifications" subtitle="Reminders and performance alerts">
      <SettingsCard>
        <SettingsRow
          label="Workout reminders"
          toggleValue={settings.notifications.workoutReminders}
          onToggleChange={(value) =>
            updateSettings((current) => ({ ...current, notifications: { ...current.notifications, workoutReminders: value } }))
          }
        />
        <SettingsRow
          label="Streak notifications"
          toggleValue={settings.notifications.streakNotifications}
          onToggleChange={(value) =>
            updateSettings((current) => ({ ...current, notifications: { ...current.notifications, streakNotifications: value } }))
          }
        />
        <SettingsRow
          label="PR alerts"
          toggleValue={settings.notifications.prAlerts}
          onToggleChange={(value) =>
            updateSettings((current) => ({ ...current, notifications: { ...current.notifications, prAlerts: value } }))
          }
        />
      </SettingsCard>
    </SettingsScaffold>
  );
}
