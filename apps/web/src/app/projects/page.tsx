import { ProjectsScreen } from '@/features/projects/components/projects-screen';
import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Tous les projets';

export default function ProjectsPage() {
  return (
    <AppShell title={TITLE} sidebar={<OverviewSidebar selected={null} />}>
      <ProjectsScreen title={TITLE} />
    </AppShell>
  );
}
