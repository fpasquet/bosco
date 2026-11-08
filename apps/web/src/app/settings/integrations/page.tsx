import { IntegrationsScreen } from '@/features/context/components/integrations';
import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Réglages';

export default function IntegrationsPage() {
  return (
    <AppShell title={TITLE} sidebar={<OverviewSidebar selected={null} />}>
      <IntegrationsScreen title={TITLE} />
    </AppShell>
  );
}
