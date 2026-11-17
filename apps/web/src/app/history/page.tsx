import { HistoryScreen } from '@/features/sessions/components/history-screen';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Historique';

/** `?tab=costs` ouvre l'onglet des coûts ; `?project=labo-ia` filtre sur un projet (« Voir l'historique » d'un projet). */
export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; tab?: string }>;
}) {
  const { project, tab } = await searchParams;
  return (
    <AppShell title={TITLE} place={{ kind: 'history' }}>
      <HistoryScreen title={TITLE} tab={tab === 'costs' ? 'costs' : 'list'} project={project ?? null} />
    </AppShell>
  );
}
