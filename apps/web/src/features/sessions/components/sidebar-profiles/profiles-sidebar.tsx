'use client';
import { useQuery } from '@tanstack/react-query';
import { useNow } from '@/shared/hooks/use-now';
import { sessionsQuery } from '../../api/sessions';
import { sourcesQuery } from '../../api/sources';
import { displayPath } from '../../lib/format';
import { openSessions } from '../../lib/overview';
import { SidebarProfiles } from './sidebar-profiles';

/** Profils surveillés de la barre latérale, lus dans les caches que le flux en direct tient à jour. */
export function ProfilesSidebar() {
  const now = useNow(30_000);
  const { data: sources } = useQuery(sourcesQuery);
  const { data: sessions } = useQuery({ ...sessionsQuery, enabled: (sources?.sources.length ?? 0) > 0 });
  if (!sources) return null;
  const open = openSessions(sessions ?? [], now);
  return (
    <SidebarProfiles
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
