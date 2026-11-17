import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { AppShell } from '@/shared/layouts/app-shell';
import { TaskPage as TaskScreen } from './task-page';

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell title={`T-${id}`} sidebar={<OverviewSidebar selected={null} />}>
      <TaskScreen id={Number(id)} />
    </AppShell>
  );
}
