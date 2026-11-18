import type { ProfileSettingsDto, SourcesDto } from '@bosco/domain';

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

/** Réglages d'un profil (E4g) : son compte, ses valeurs par défaut et celles du profil Claude Code, ce qui l'utilise. */
export const profileSettingsQuery = (sourceId: string) => ({
  queryKey: ['sources', 'settings', sourceId],
  queryFn: async (): Promise<ProfileSettingsDto> => {
    const response = await fetch(`/api/sources/${encodeURIComponent(sourceId)}/settings`);
    if (!response.ok) throw new Error(`GET /api/sources/${sourceId}/settings answered ${response.status}`);
    return (await response.json()) as ProfileSettingsDto;
  },
});

/** « Enregistrer » les valeurs par défaut d'un profil, gardées par Bosco sans toucher aux fichiers du profil. */
export async function changeProfileDefaults(
  sourceId: string,
  defaults: ProfileSettingsDto['defaults'],
): Promise<ProfileSettingsDto> {
  const response = await fetch(`/api/sources/${encodeURIComponent(sourceId)}/defaults`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(defaults),
  });
  if (!response.ok) throw new Error(`PUT /api/sources/${sourceId}/defaults answered ${response.status}`);
  return (await response.json()) as ProfileSettingsDto;
}
