import { ProjectSettingsScreen } from '@/features/sessions/components/project-settings';
import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Réglages';

export default function ProjectsSettingsPage() {
  return (
    <AppShell title={TITLE} sidebar={<OverviewSidebar selected={null} />}>
      <ProjectSettingsScreen title={TITLE} />
    </AppShell>
  );
}
