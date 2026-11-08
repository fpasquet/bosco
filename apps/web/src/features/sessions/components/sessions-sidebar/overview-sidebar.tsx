'use client';
import { useQuery } from '@tanstack/react-query';
import { useNow } from '@/shared/hooks/use-now';
import { Skeleton } from '@/shared/ui/skeleton';
import { sessionsQuery } from '../../api/sessions';
import { sourcesQuery } from '../../api/sources';
import { useOffline } from '../../lib/connection';
import { displayPath } from '../../lib/format';
import { openSessions, repositoriesOf } from '../../lib/overview';
import { SessionsSidebar } from './sessions-sidebar';

/** Barre latérale de la vue d'ensemble, lue dans les caches que le flux en direct tient à jour. */
export function OverviewSidebar({ selected }: { selected: null | string }) {
  const now = useNow(30_000);
  const { data: sources } = useQuery(sourcesQuery);
  const offline = useOffline();
  const { data: sessions } = useQuery({ ...sessionsQuery, enabled: (sources?.sources.length ?? 0) > 0 });
  if (!sources)
    return (
      <div role="status" aria-busy className="flex flex-col gap-2.5 px-3 pt-2">
        <span className="sr-only">Chargement…</span>
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
      </div>
    );
  if (sources.sources.length === 0) return null;
  const open = openSessions(sessions ?? [], now);
  return (
    <SessionsSidebar
      selected={selected}
      showStatus={!offline}
      liveTracking={sources.sources.some((source) => source.liveTracking)}
      repositories={repositoriesOf(open)}
      profiles={sources.sources
        .filter((source) => source.watched)
        .map((source) => ({
          label: source.label,
          path: displayPath(source.path, sources.home),
          count: open.filter((session) => session.sourceId === source.id).length,
        }))}
    />
  );
}
