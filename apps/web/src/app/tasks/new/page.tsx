import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { TaskEditor } from '@/features/tasks/components/task-editor';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Nouvelle tâche';

export default function NewTaskPage() {
  return (
    <AppShell title={TITLE} sidebar={<OverviewSidebar selected={null} />}>
      <TaskEditor title={TITLE} />
    </AppShell>
  );
}
