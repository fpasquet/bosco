import { NotificationsScreen } from '@/features/notifications/components/notifications-screen';
import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { AppShell } from '@/shared/layouts/app-shell';

export default function NotificationsPage() {
  return (
    <AppShell title="Notifications" sidebar={<OverviewSidebar selected={null} />}>
      <NotificationsScreen />
    </AppShell>
  );
}
