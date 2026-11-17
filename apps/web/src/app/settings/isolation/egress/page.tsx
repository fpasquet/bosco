import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { IsolationScreen } from '@/features/tasks/components/isolation-screen';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Réglages';

export default function EgressPage() {
  return (
    <AppShell title={TITLE} sidebar={<OverviewSidebar selected={null} />}>
      <IsolationScreen title={TITLE} view="egress" />
    </AppShell>
  );
}
