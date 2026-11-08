import { NewSocleScreen } from '@/features/context/components/socles-screen';
import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { AppShell } from '@/shared/layouts/app-shell';

export default function NewSoclePage() {
  return (
    <AppShell title="Nouveau socle" sidebar={<OverviewSidebar selected={null} />}>
      <NewSocleScreen />
    </AppShell>
  );
}
