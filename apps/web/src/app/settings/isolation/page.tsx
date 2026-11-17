import { IsolationScreen } from '@/features/sandbox/components/isolation-screen';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Réglages';

export default function IsolationPage() {
  return (
    <AppShell title={TITLE} place={{ kind: 'settings' }}>
      <IsolationScreen title={TITLE} />
    </AppShell>
  );
}
