import { NewSessionScreen } from '@/features/sessions/components/new-session-screen';
import { AppShell, type ShellPlace } from '@/shared/layouts/app-shell';

function idOf(value: string | undefined): null | number {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Une nouvelle session est à la place de la page d'où elle part : un groupe, un projet, sinon la vue d'ensemble. */
function placeOf(origin: { group: null | number; project: null | number }): ShellPlace {
  if (origin.group !== null) return { kind: 'group', id: origin.group };
  if (origin.project !== null) return { kind: 'project', id: origin.project };
  return { kind: 'overview' };
}

/** Nouvelle session ; `?project=2` ou `?group=3` : elle part de la page de ce projet ou de ce groupe. */
export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; project?: string }>;
}) {
  const { group, project } = await searchParams;
  const origin = { group: idOf(group), project: idOf(project) };
  return (
    <AppShell title="Nouvelle session" place={placeOf(origin)}>
      <NewSessionScreen origin={origin} />
    </AppShell>
  );
}
