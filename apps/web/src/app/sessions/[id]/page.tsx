import { SessionDetailScreen } from '@/features/sessions/components/session-detail-screen';
import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { AppShell } from '@/shared/layouts/app-shell';

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell title="Session" sidebar={<OverviewSidebar selected={null} />}>
      <SessionDetailScreen id={id} />
    </AppShell>
  );
}
