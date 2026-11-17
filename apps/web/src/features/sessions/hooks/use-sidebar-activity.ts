'use client';
import { useQuery } from '@tanstack/react-query';
import { useNow } from '@/shared/hooks/use-now';
import { sessionsQuery } from '../api/sessions';
import { sourcesQuery } from '../api/sources';
import { openSessions, type PlaceActivity, projectsOf } from '../lib/overview';

export interface SidebarActivity {
  outside: PlaceActivity;
  projects: (PlaceActivity & { id: number })[];
}

/**
 * Sessions ouvertes par projet pour la barre latérale, lues dans les caches que le flux en direct tient à jour.
 * watching : false au premier lancement, sans profil surveillé ; undefined pendant le chargement.
 */
export function useSidebarActivity(): { activity: null | SidebarActivity; watching: boolean | undefined } {
  const now = useNow(30_000);
  const { data: sources } = useQuery(sourcesQuery);
  const watching = sources ? sources.sources.length > 0 : undefined;
  const { data: sessions } = useQuery({ ...sessionsQuery, enabled: watching === true });
  return { watching, activity: sessions ? projectsOf(openSessions(sessions, now)) : null };
}
