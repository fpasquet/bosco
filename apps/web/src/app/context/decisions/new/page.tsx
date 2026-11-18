import { NewDecisionScreen } from '@/features/context/components/decision-screen';
import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { AppShell } from '@/shared/layouts/app-shell';

export default async function NewDecisionPage({
  searchParams,
}: {
  searchParams: Promise<{ replaces?: string; project?: string }>;
}) {
  const { replaces, project } = await searchParams;
  return (
    <AppShell title="Nouvelle décision" sidebar={<OverviewSidebar selected={null} />}>
      <NewDecisionScreen project={project ?? ''} replaces={replaces ? Number(replaces) : null} />
    </AppShell>
  );
}
