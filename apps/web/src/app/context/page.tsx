import { LegacyContextRedirect } from '@/features/context/components/legacy-context-redirect';
import { AppShell } from '@/shared/layouts/app-shell';

/** Ancien écran du contexte (« ?project=site-perso ») : l'onglet Contexte de la page du projet. */
export default async function ContextPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project } = await searchParams;
  return (
    <AppShell title="Contexte" place={{ kind: 'projects' }}>
      <LegacyContextRedirect project={project ?? null} decision={null} />
    </AppShell>
  );
}
