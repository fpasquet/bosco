import { HistoryScreen } from '@/features/sessions/components/history-screen';
import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Historique';

/** `?tab=costs` ouvre l'onglet des coûts (E3b) ; `?repo=labo-ia` filtre sur un dépôt (E1c, E3b). */
export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ repo?: string; tab?: string }>;
}) {
  const { repo, tab } = await searchParams;
  return (
    <AppShell title={TITLE} sidebar={<OverviewSidebar selected={null} />}>
      <HistoryScreen title={TITLE} tab={tab === 'costs' ? 'costs' : 'list'} repository={repo ?? null} />
    </AppShell>
  );
}
