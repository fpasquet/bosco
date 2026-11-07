import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { TestEnvironmentScreen } from '@/features/tasks/components/test-environment-screen';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Réglages';

export default function TestEnvironmentsPage() {
  return (
    <AppShell title={TITLE} sidebar={<OverviewSidebar selected={null} />}>
      <TestEnvironmentScreen title={TITLE} />
    </AppShell>
  );
}
