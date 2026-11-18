import type { ProfileSettingsDto, SourceDto, SourcesDto } from '@bosco/domain';

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

/** Refus de l'ajout d'un dossier, traduit pour l'interface. */
export class FolderRefused extends Error {}

const FOLDER_REFUSALS: Record<string, string> = {
  notAProfile: 'Ce dossier n’est pas un dossier de configuration de Claude Code.',
  sourceAlreadyKnown: 'Ce dossier est déjà une source.',
};

/** « Ajouter un dossier » : un autre dossier de configuration de Claude Code, surveillé comme un profil. */
export async function addSource(path: string): Promise<SourceDto> {
  const response = await fetch('/api/sources/folder', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path }),
  });
  if (!response.ok) {
    const { code } = (await response.json().catch(() => ({}))) as { code?: string };
    throw new FolderRefused((code && FOLDER_REFUSALS[code]) ?? 'Le dossier n’a pas pu être ajouté.');
  }
  return (await response.json()) as SourceDto;
}

/** Interrupteur d'une source : la lecture s'arrête ou reprend, rien n'est effacé. */
export async function setSourceWatched(sourceId: string, watched: boolean): Promise<void> {
  const response = await fetch(`/api/sources/${encodeURIComponent(sourceId)}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ watched }),
  });
  if (!response.ok) throw new Error(`PATCH /api/sources/${sourceId} answered ${response.status}`);
}

/** Réglages d'un profil : son compte, ses valeurs par défaut et celles du profil Claude Code, ce qui l'utilise. */
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
