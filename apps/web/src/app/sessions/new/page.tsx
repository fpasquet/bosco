import { NewSessionScreen } from '@/features/sessions/components/new-session-screen';
import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { AppShell } from '@/shared/layouts/app-shell';

export default function NewSessionPage() {
  return (
    <AppShell title="Nouvelle session" sidebar={<OverviewSidebar selected={null} />}>
      <NewSessionScreen />
    </AppShell>
  );
}
