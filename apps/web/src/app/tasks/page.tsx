import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { TasksScreen } from '@/features/tasks/components/tasks-screen';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Tâches';

export default function TasksPage() {
  return (
    <AppShell title={TITLE} sidebar={<OverviewSidebar selected={null} />}>
      <TasksScreen title={TITLE} />
    </AppShell>
  );
}
