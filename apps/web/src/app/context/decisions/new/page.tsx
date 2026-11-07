import { NewDecisionScreen } from '@/features/context/components/decision-screen';
import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { AppShell } from '@/shared/layouts/app-shell';

export default async function NewDecisionPage({
  searchParams,
}: {
  searchParams: Promise<{ replaces?: string; repository?: string; socle?: string }>;
}) {
  const { replaces, repository, socle } = await searchParams;
  const target = socle
    ? { kind: 'socle' as const, id: Number(socle) }
    : { kind: 'repository' as const, name: repository ?? '' };
  return (
    <AppShell title="Nouvelle décision" sidebar={<OverviewSidebar selected={null} />}>
      <NewDecisionScreen target={target} replaces={replaces ? Number(replaces) : null} />
    </AppShell>
  );
}
