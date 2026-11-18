import { ProjectPage } from '@/features/projects/components/project-page';
import { ProjectSettings } from '@/features/projects/components/project-settings';
import { AppShell } from '@/shared/layouts/app-shell';

/** Page d'un projet, onglet Réglages ; « ?domain= » remplit le champ d'ajout d'un domaine du projet. */
export default async function ProjectSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ domain?: string }>;
}) {
  const id = Number((await params).id);
  const { domain } = await searchParams;
  return (
    <AppShell title="Projet" place={{ kind: 'project', id }}>
      <ProjectPage id={id} tab="settings">
        <ProjectSettings id={id} domain={domain ?? null} />
      </ProjectPage>
    </AppShell>
  );
}
