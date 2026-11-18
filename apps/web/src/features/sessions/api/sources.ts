import type {
  FolderListingDto,
  HistoryPeriodDto,
  ProfileSettingsDto,
  SourceDto,
  SourceRemovalDto,
  SourcesDto,
} from '@bosco/domain';

export const sourcesQuery = {
  queryKey: ['sources'],
  queryFn: async (): Promise<SourcesDto> => {
    const response = await fetch('/api/sources');
    if (!response.ok) throw new Error(`GET /api/sources answered ${response.status}`);
    return (await response.json()) as SourcesDto;
  },
};

/** Premier lancement : les profils cochés, lus sur la période choisie (les 30 derniers jours ou tout l'historique). */
export async function watchProfiles(paths: string[], history: HistoryPeriodDto): Promise<void> {
  const response = await fetch('/api/sources', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ history, paths }),
  });
  if (!response.ok) throw new Error(`POST /api/sources answered ${response.status}`);
}

/** Navigateur de « Ajouter un dossier » : un dossier du dossier personnel, dossiers cachés compris. */
export const profileFoldersQuery = (path: null | string) => ({
  queryKey: ['folders', 'hidden', path],
  queryFn: async (): Promise<FolderListingDto> => {
    const params = new URLSearchParams({ hidden: 'true', ...(path ? { path } : {}) });
    const response = await fetch(`/api/folders?${params.toString()}`);
    if (!response.ok) throw new Error(`GET /api/folders answered ${response.status}`);
    return (await response.json()) as FolderListingDto;
  },
});

/** Navigateur de « Utiliser un jeton longue durée » : dossiers et fichiers, cachés compris, leurs noms seulement. */
export const tokenFilesQuery = (path: null | string) => ({
  queryKey: ['folders', 'hidden', 'files', path],
  queryFn: async (): Promise<FolderListingDto> => {
    const params = new URLSearchParams({ hidden: 'true', files: 'true', ...(path ? { path } : {}) });
    const response = await fetch(`/api/folders?${params.toString()}`);
    if (!response.ok) throw new Error(`GET /api/folders answered ${response.status}`);
    return (await response.json()) as FolderListingDto;
  },
});

/** Refus du fichier d'un jeton, avec sa raison (« Le fichier du jeton est vide. »). */
export class TokenFileRefused extends Error {}

/**
 * « Utiliser un jeton longue durée » : le fichier qui contient le jeton de `claude setup-token`, dont Bosco ne garde que
 * le chemin ; null le retire. Rend les réglages du profil, accès compris.
 */
export async function declareToken(sourceId: string, path: null | string): Promise<ProfileSettingsDto> {
  const response = await fetch(`/api/sources/${encodeURIComponent(sourceId)}/token`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path }),
  });
  if (!response.ok) {
    const { message } = (await response.json().catch(() => ({}))) as { message?: string };
    throw new TokenFileRefused(message ?? 'Le fichier du jeton n’a pas pu être enregistré.');
  }
  return (await response.json()) as ProfileSettingsDto;
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

/** Ce que retirer une source changerait : sessions oubliées, ce qui est retiré du profil, ce qui l'utilise. */
export const sourceRemovalQuery = (sourceId: string) => ({
  queryKey: ['sources', 'removal', sourceId],
  queryFn: async (): Promise<SourceRemovalDto> => {
    const response = await fetch(`/api/sources/${encodeURIComponent(sourceId)}/removal`);
    if (!response.ok) throw new Error(`GET /api/sources/${sourceId}/removal answered ${response.status}`);
    return (await response.json()) as SourceRemovalDto;
  },
});

/** « Retirer la source » : Bosco l'oublie avec ses sessions, sans rien supprimer dans le dossier du profil. */
export async function removeSource(sourceId: string): Promise<void> {
  const response = await fetch(`/api/sources/${encodeURIComponent(sourceId)}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`DELETE /api/sources/${sourceId} answered ${response.status}`);
}
