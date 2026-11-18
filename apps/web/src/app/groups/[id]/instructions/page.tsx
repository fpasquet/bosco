import { GroupScreen } from '@/features/projects/components/group-screen';
import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { AppShell } from '@/shared/layouts/app-shell';

export default async function GroupInstructionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell title="Groupe" sidebar={<OverviewSidebar selected={null} selectedGroup={Number(id)} />}>
      <GroupScreen id={Number(id)} tab="instructions" />
    </AppShell>
  );
}
