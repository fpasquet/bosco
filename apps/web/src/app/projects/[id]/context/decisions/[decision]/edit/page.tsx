import { EditDecisionScreen } from '@/features/context/components/decision-screen';
import { AppShell } from '@/shared/layouts/app-shell';

/** Nouvelle version d'une décision acceptée. */
export default async function EditDecisionPage({ params }: { params: Promise<{ decision: string; id: string }> }) {
  const { decision, id } = await params;
  return (
    <AppShell title={`Modifier DEC-${decision}`} place={{ kind: 'project', id: Number(id) }}>
      <EditDecisionScreen id={Number(decision)} projectId={Number(id)} />
    </AppShell>
  );
}
