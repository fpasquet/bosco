import { NotificationSettingsScreen } from '@/features/notifications/components/notification-settings';
import { AppShell } from '@/shared/layouts/app-shell';

/** Réglages › Notifications. */
export default function NotificationSettingsPage() {
  return (
    <AppShell title="Notifications" place={{ kind: 'settings' }}>
      <NotificationSettingsScreen />
    </AppShell>
  );
}
