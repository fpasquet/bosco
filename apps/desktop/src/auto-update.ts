// Mise à jour de l'AppImage : electron-updater lit latest-linux.yml (ou beta-linux.yml) dans les releases GitHub,
// télécharge la nouvelle version en arrière-plan, puis l'application propose « Relancer pour mettre à jour ». Le .deb
// ne se met pas à jour seul : le service signale la nouvelle version dans l'interface.

export type UpdateChannel = 'beta' | 'stable';

/** Réglages › À propos : les mises à jour sont-elles cherchées, et sur quel canal. */
export interface UpdatePreferences {
  channel: UpdateChannel;
  enabled: boolean;
}

const DEFAULTS: UpdatePreferences = { channel: 'stable', enabled: true };

/** Préférences lues dans la réponse de GET /api/about ; illisibles, celles par défaut (stable, actives). */
export function preferencesOf(about: unknown): UpdatePreferences {
  if (typeof about !== 'object' || about === null || !('updates' in about)) return DEFAULTS;
  const { updates } = about;
  if (typeof updates !== 'object' || updates === null) return DEFAULTS;
  const { channel, enabled } = updates as { channel?: unknown; enabled?: unknown };
  return {
    channel: channel === 'beta' ? 'beta' : 'stable',
    enabled: typeof enabled === 'boolean' ? enabled : true,
  };
}

/** Canal d'electron-updater : « latest » pour les stables, « beta » pour les betas et les stables. */
export function updaterChannel(channel: UpdateChannel): 'beta' | 'latest' {
  return channel === 'beta' ? 'beta' : 'latest';
}

/** Façon dont l'application est installée, transmise au service (BOSCO_INSTALL). */
export function installKind(where: { appImage: string | undefined; packaged: boolean }): 'appimage' | 'deb' | 'source' {
  if (where.appImage) return 'appimage';
  return where.packaged ? 'deb' : 'source';
}
