import { GroupScreen } from '@/features/projects/components/group-screen';
import { PlaceSessions } from '@/features/sessions/components/place-sessions';
import { AppShell } from '@/shared/layouts/app-shell';

/** Page d'un groupe, onglet Sessions : les sessions de tous ses projets. */
export default async function GroupSessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  return (
    <AppShell title="Groupe" place={{ kind: 'group', id }}>
      <GroupScreen id={id} tab="sessions">
        <PlaceSessions place={{ kind: 'group', id }} />
      </GroupScreen>
    </AppShell>
  );
}
