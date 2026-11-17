import { IsolationScreen } from '@/features/sandbox/components/isolation-screen';
import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Réglages';

export default function IsolationPage() {
  return (
    <AppShell title={TITLE} sidebar={<OverviewSidebar selected={null} />}>
      <IsolationScreen title={TITLE} />
    </AppShell>
  );
}
