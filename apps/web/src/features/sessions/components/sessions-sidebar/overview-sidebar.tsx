'use client';
import { useQuery } from '@tanstack/react-query';
import { sessionsQuery } from '../../api/sessions';
import { sourcesQuery } from '../../api/sources';
import { useNow } from '../../hooks/use-now';
import { displayPath } from '../../lib/format';
import { openSessions, repositoriesOf } from '../../lib/overview';
import { SessionsSidebar } from './sessions-sidebar';

/** Barre latérale de la vue d'ensemble, lue dans les caches que le flux en direct tient à jour. */
export function OverviewSidebar({ selected }: { selected: null | string }) {
  const now = useNow(30_000);
  const { data: sources } = useQuery(sourcesQuery);
  const { data: sessions } = useQuery({ ...sessionsQuery, enabled: (sources?.sources.length ?? 0) > 0 });
  if (!sources || sources.sources.length === 0) return null;
  const open = openSessions(sessions ?? [], now);
  return (
    <SessionsSidebar
      selected={selected}
      liveTracking={sources.sources.some((source) => source.liveTracking)}
      repositories={repositoriesOf(open)}
      profiles={sources.sources.map((source) => ({
        label: source.label,
        path: displayPath(source.path, sources.home),
        count: open.filter((session) => session.sourceId === source.id).length,
      }))}
    />
  );
}
