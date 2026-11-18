import type { AboutDto, AvailableReleaseDto, InstallKindDto } from '@bosco/domain';

/** « 0.2.0 », « 0.3.0-beta.1 · bêta », ou la version et son commit hors d'une release (« 0.2.0 · 3118cb5 »). */
export function versionLabel({ commit, release, version }: Pick<AboutDto, 'commit' | 'release' | 'version'>): string {
  if (!release) return commit ? `${version} · ${commit}` : version;
  return version.includes('-beta.') ? `${version} · bêta` : version;
}

/** Version de l'application Android, qu'elle donne dans son agent utilisateur (« BoscoAndroid/0.3.0 »). */
export function androidVersion(userAgent: string): null | string {
  const version = /BoscoAndroid\/(\S+)/.exec(userAgent)?.[1];
  // Avant les releases, l'application se présentait en « BoscoAndroid/1.0 », sans vraie version
  return version && version !== '1.0' ? version : null;
}

export const INSTALL_LABELS: Record<InstallKindDto, string> = {
  appimage: 'AppImage, mise à jour automatique',
  deb: 'paquet .deb',
  source: 'depuis le dépôt',
};

/**
 * Le fichier à télécharger pour une version disponible : l'APK sur le téléphone, le paquet .deb sur le poste. L'AppImage
 * se télécharge seule : rien à proposer.
 */
export function downloadOf(
  available: AvailableReleaseDto,
  where: { install: InstallKindDto; phone: boolean },
): null | { label: string; url: string } {
  if (where.phone) return available.downloads.apk ? { label: 'Télécharger l’APK', url: available.downloads.apk } : null;
  if (where.install === 'appimage') return null;
  if (available.downloads.deb) return { label: 'Télécharger le .deb', url: available.downloads.deb };
  return available.downloads.appImage ? { label: 'Télécharger l’AppImage', url: available.downloads.appImage } : null;
}
