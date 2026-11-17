import { ProjectContext } from '@/features/context/components/project-context';
import { ProjectPage } from '@/features/projects/components/project-page';
import { AppShell } from '@/shared/layouts/app-shell';

/** Page d'un projet, onglet Contexte. */
export default async function ProjectContextPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  return (
    <AppShell title="Projet" place={{ kind: 'project', id }}>
      <ProjectPage id={id} tab="context">
        <ProjectContext projectId={id} />
      </ProjectPage>
    </AppShell>
  );
}
