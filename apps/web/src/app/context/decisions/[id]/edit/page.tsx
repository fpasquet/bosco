import { LegacyContextRedirect } from '@/features/context/components/legacy-context-redirect';
import { AppShell } from '@/shared/layouts/app-shell';

/** Ancienne adresse de la modification d'une décision : sous le contexte de son projet. */
export default async function EditDecisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell title={`Modifier DEC-${id}`} place={{ kind: 'projects' }}>
      <LegacyContextRedirect project={null} decision={Number(id)} edit />
    </AppShell>
  );
}
