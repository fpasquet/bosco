import { RepositorySettingsScreen } from '@/features/sessions/components/repository-settings';
import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Réglages';

export default function RepositoriesSettingsPage() {
  return (
    <AppShell title={TITLE} sidebar={<OverviewSidebar selected={null} />}>
      <RepositorySettingsScreen title={TITLE} />
    </AppShell>
  );
}
