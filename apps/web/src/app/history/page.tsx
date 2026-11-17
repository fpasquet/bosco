import { HistoryScreen } from '@/features/sessions/components/history-screen';
import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Historique';

/** `?tab=costs` ouvre l'onglet des coûts (E3b) ; `?project=labo-ia` filtre sur un projet (E1c, E3b). */
export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; tab?: string }>;
}) {
  const { project, tab } = await searchParams;
  return (
    <AppShell title={TITLE} sidebar={<OverviewSidebar selected={null} />}>
      <HistoryScreen title={TITLE} tab={tab === 'costs' ? 'costs' : 'list'} project={project ?? null} />
    </AppShell>
  );
}
