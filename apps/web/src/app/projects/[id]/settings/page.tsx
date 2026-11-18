import { ProjectPage } from '@/features/projects/components/project-page';
import { ProjectSettings } from '@/features/projects/components/project-settings';
import { AppShell } from '@/shared/layouts/app-shell';

/** Page d'un projet, onglet Réglages. */
export default async function ProjectSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  return (
    <AppShell title="Projet" place={{ kind: 'project', id }}>
      <ProjectPage id={id} tab="settings">
        <ProjectSettings id={id} />
      </ProjectPage>
    </AppShell>
  );
}
