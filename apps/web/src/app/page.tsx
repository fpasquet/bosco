import { ProjectRedirect } from '@/features/projects/components/project-redirect';
import { OverviewScreen } from '@/features/sessions/components/overview-screen';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Vue d’ensemble';

/** Vue d'ensemble. L'ancienne vue filtrée sur un projet (`?project=maison`) mène à la page du projet. */
export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project } = await searchParams;
  return (
    <AppShell title={TITLE} place={{ kind: 'overview' }}>
      {project ? <ProjectRedirect name={project} /> : <OverviewScreen title={TITLE} />}
    </AppShell>
  );
}
