import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { SourcesScreen } from '@/features/sessions/components/sources-screen';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Sources';

export default function SourcesPage() {
  return (
    <AppShell title={TITLE} sidebar={<OverviewSidebar selected={null} />}>
      <SourcesScreen title={TITLE} />
    </AppShell>
  );
}
