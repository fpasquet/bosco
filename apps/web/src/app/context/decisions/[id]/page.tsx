import { DecisionScreen } from '@/features/context/components/decision-screen';
import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { AppShell } from '@/shared/layouts/app-shell';

export default async function DecisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell title={`DEC-${id}`} sidebar={<OverviewSidebar selected={null} />}>
      <DecisionScreen id={Number(id)} />
    </AppShell>
  );
}
