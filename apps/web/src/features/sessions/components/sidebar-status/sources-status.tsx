'use client';
import { useQuery } from '@tanstack/react-query';
import { sourcesQuery } from '../../api/sources';
import { useOffline } from '../../lib/connection';
import { SidebarStatus } from './sidebar-status';

/** État des sources de la barre latérale ; il se cache quand Bosco est injoignable : il serait périmé. */
export function SourcesStatus() {
  const { data: sources } = useQuery(sourcesQuery);
  const offline = useOffline();
  if (!sources || offline) return null;
  const watched = sources.sources.filter((source) => source.watched);
  if (watched.length === 0) return null;
  return (
    <SidebarStatus watched={watched.length} liveTracking={sources.sources.some((source) => source.liveTracking)} />
  );
}
