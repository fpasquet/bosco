import { ProjectsScreen } from '@/features/projects/components/projects-screen';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Tous les projets';

export default function ProjectsPage() {
  return (
    <AppShell title={TITLE} place={{ kind: 'projects' }}>
      <ProjectsScreen title={TITLE} />
    </AppShell>
  );
}
