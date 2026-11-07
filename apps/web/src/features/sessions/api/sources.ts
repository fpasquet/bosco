import type { SourcesDto } from '@bosco/domain';

export const sourcesQuery = {
  queryKey: ['sources'],
  queryFn: async (): Promise<SourcesDto> => {
    const response = await fetch('/api/sources');
    if (!response.ok) throw new Error(`GET /api/sources answered ${response.status}`);
    return (await response.json()) as SourcesDto;
  },
};

export async function watchProfiles(paths: string[]): Promise<void> {
  const response = await fetch('/api/sources', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ paths }),
  });
  if (!response.ok) throw new Error(`POST /api/sources answered ${response.status}`);
}

/** Interrupteur d'une source : la lecture s'arrête ou reprend, rien n'est effacé (CA-SESS-56). */
export async function setSourceWatched(sourceId: string, watched: boolean): Promise<void> {
  const response = await fetch(`/api/sources/${encodeURIComponent(sourceId)}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ watched }),
  });
  if (!response.ok) throw new Error(`PATCH /api/sources/${sourceId} answered ${response.status}`);
}
