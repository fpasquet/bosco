import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { TaskDetailScreen } from '@/features/tasks/components/task-detail-screen';
import { AppShell } from '@/shared/layouts/app-shell';

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell title={`T-${id}`} sidebar={<OverviewSidebar selected={null} />}>
      <TaskDetailScreen id={Number(id)} />
    </AppShell>
  );
}
