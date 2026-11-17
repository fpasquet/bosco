import { DecisionScreen } from '@/features/context/components/decision-screen';
import { AppShell } from '@/shared/layouts/app-shell';

/** Une décision, sous le contexte de son projet. */
export default async function DecisionPage({ params }: { params: Promise<{ decision: string; id: string }> }) {
  const { decision, id } = await params;
  return (
    <AppShell title={`DEC-${decision}`} place={{ kind: 'project', id: Number(id) }}>
      <DecisionScreen id={Number(decision)} projectId={Number(id)} />
    </AppShell>
  );
}
