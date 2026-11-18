import { LegacyContextRedirect } from '@/features/context/components/legacy-context-redirect';
import { AppShell } from '@/shared/layouts/app-shell';

/** Ancienne adresse d'une décision : sous le contexte de son projet. */
export default async function DecisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell title={`DEC-${id}`} place={{ kind: 'projects' }}>
      <LegacyContextRedirect project={null} decision={Number(id)} />
    </AppShell>
  );
}
