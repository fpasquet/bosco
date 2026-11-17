import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { RightsScreen } from '@/features/tasks/components/rights-screen';
import { AppShell } from '@/shared/layouts/app-shell';

export default function RightsPage() {
  return (
    <AppShell title="Droits des agents" sidebar={<OverviewSidebar selected={null} />}>
      <RightsScreen />
    </AppShell>
  );
}
