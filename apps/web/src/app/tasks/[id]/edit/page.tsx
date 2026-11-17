import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { TaskEditor } from '@/features/tasks/components/task-editor';
import { AppShell } from '@/shared/layouts/app-shell';

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell title={`Modifier T-${id}`} sidebar={<OverviewSidebar selected={null} />}>
      <TaskEditor id={Number(id)} title={`Modifier T-${id}`} />
    </AppShell>
  );
}
