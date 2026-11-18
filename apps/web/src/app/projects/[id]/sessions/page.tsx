import { ProjectPage } from '@/features/projects/components/project-page';
import { PlaceSessions } from '@/features/sessions/components/place-sessions';
import { AppShell } from '@/shared/layouts/app-shell';

/** Page d'un projet, onglet Sessions. */
export default async function ProjectSessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  return (
    <AppShell title="Projet" place={{ kind: 'project', id }}>
      <ProjectPage id={id} tab="sessions">
        <PlaceSessions place={{ kind: 'project', id }} />
      </ProjectPage>
    </AppShell>
  );
}
