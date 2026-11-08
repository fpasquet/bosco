import { NotificationSettingsScreen } from '@/features/notifications/components/notification-settings';
import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Réglages';

export default function NotificationSettingsPage() {
  return (
    <AppShell title={TITLE} sidebar={<OverviewSidebar selected={null} />}>
      <NotificationSettingsScreen title={TITLE} />
    </AppShell>
  );
}
