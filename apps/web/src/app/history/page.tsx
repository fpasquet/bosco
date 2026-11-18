import { HistoryScreen } from '@/features/sessions/components/history-screen';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Historique';

/** `?project=api-tarifs` filtre sur un projet (« Voir l'historique » d'un projet), `?group=2` sur un groupe. */
export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; project?: string }>;
}) {
  const { group, project } = await searchParams;
  return (
    <AppShell title={TITLE} place={{ kind: 'history' }}>
      <HistoryScreen title={TITLE} project={project ?? null} group={group ? Number(group) || null : null} />
    </AppShell>
  );
}
