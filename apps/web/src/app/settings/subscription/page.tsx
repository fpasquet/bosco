import { SubscriptionScreen } from '@/features/sandbox/components/subscription-screen';
import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Réglages';

export default function SubscriptionPage() {
  return (
    <AppShell title={TITLE} sidebar={<OverviewSidebar selected={null} />}>
      <SubscriptionScreen title={TITLE} />
    </AppShell>
  );
}
