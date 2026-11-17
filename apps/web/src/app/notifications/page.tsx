import { NotificationsScreen } from '@/features/notifications/components/notifications-screen';
import { AppShell } from '@/shared/layouts/app-shell';

export default function NotificationsPage() {
  return (
    <AppShell title="Notifications" place={{ kind: 'other' }}>
      <NotificationsScreen />
    </AppShell>
  );
}
