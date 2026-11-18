import { LegacyContextRedirect } from '@/features/context/components/legacy-context-redirect';
import { AppShell } from '@/shared/layouts/app-shell';

/** Ancienne adresse d'une nouvelle décision : sous le contexte de son projet. */
export default async function NewDecisionPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; replaces?: string }>;
}) {
  const { project, replaces } = await searchParams;
  return (
    <AppShell title="Nouvelle décision" place={{ kind: 'projects' }}>
      <LegacyContextRedirect
        project={project ?? null}
        decision={null}
        newDecision
        replaces={replaces ? Number(replaces) : null}
      />
    </AppShell>
  );
}
