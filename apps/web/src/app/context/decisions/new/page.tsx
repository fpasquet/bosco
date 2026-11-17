import { NewDecisionScreen } from '@/features/context/components/decision-screen';
import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { AppShell } from '@/shared/layouts/app-shell';

export default async function NewDecisionPage({
  searchParams,
}: {
  searchParams: Promise<{ replaces?: string; project?: string; socle?: string }>;
}) {
  const { replaces, project, socle } = await searchParams;
  const target = socle
    ? { kind: 'socle' as const, id: Number(socle) }
    : { kind: 'project' as const, name: project ?? '' };
  return (
    <AppShell title="Nouvelle décision" sidebar={<OverviewSidebar selected={null} />}>
      <NewDecisionScreen target={target} replaces={replaces ? Number(replaces) : null} />
    </AppShell>
  );
}
