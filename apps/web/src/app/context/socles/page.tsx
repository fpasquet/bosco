import { SoclesScreen } from '@/features/context/components/socles-screen';
import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { AppShell } from '@/shared/layouts/app-shell';

export default function SoclesPage() {
  return (
    <AppShell title="Socles" sidebar={<OverviewSidebar selected={null} />}>
      <SoclesScreen />
    </AppShell>
  );
}
