import { NotificationSettingsScreen } from '@/features/notifications/components/notification-settings';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Réglages';

export default function NotificationSettingsPage() {
  return (
    <AppShell title={TITLE} place={{ kind: 'settings' }}>
      <NotificationSettingsScreen title={TITLE} />
    </AppShell>
  );
}
