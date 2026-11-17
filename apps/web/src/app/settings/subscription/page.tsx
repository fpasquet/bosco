import { SubscriptionScreen } from '@/features/sandbox/components/subscription-screen';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Réglages';

export default function SubscriptionPage() {
  return (
    <AppShell title={TITLE} place={{ kind: 'settings' }}>
      <SubscriptionScreen title={TITLE} />
    </AppShell>
  );
}
