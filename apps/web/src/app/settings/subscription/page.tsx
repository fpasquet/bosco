import { SubscriptionScreen } from '@/features/sandbox/components/subscription-screen';
import { AppShell } from '@/shared/layouts/app-shell';

/** Réglages › Abonnement Claude. */
export default function SubscriptionPage() {
  return (
    <AppShell title="Abonnement Claude" place={{ kind: 'settings' }}>
      <SubscriptionScreen />
    </AppShell>
  );
}
