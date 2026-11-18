/** Canal suivi pour les mises à jour : les versions stables seules, ou aussi les betas. */
export type UpdateChannelDto = 'beta' | 'stable';

/** Façon dont Bosco est installé : paquet .deb, AppImage (qui se met à jour seule), ou depuis le dépôt. */
export type InstallKindDto = 'appimage' | 'deb' | 'source';

/** Une version publiée sur GitHub, plus récente que celle qui tourne. */
export interface AvailableReleaseDto {
  version: string;
  publishedAt: string;
  /** Notes de la version, en Markdown, telles que la release les donne */
  notes: string;
  /** Page de la release sur GitHub */
  url: string;
  /** Fichiers à télécharger, quand la release les joint */
  downloads: { apk: null | string; appImage: null | string; deb: null | string };
}

/** Réglages › À propos : la version qui tourne, les mises à jour et le bandeau d'après une mise à jour. */
export interface AboutDto {
  /** Version qui tourne (« 0.3.0-beta.1 »), sans le suffixe de construction */
  version: string;
  /** Commit construit, pour une version qui n'est pas une release (make beta, make dev) ; null pour une release */
  commit: null | string;
  /** Version publiée par le workflow Release */
  release: boolean;
  install: InstallKindDto;
  updates: {
    enabled: boolean;
    channel: UpdateChannelDto;
    /** Dernière recherche, réussie ou non */
    checkedAt: null | string;
    /** La dernière recherche a échoué (réseau, GitHub) : son message */
    error: null | string;
    available: AvailableReleaseDto | null;
    /** L'avis de cette version a été fermé : il ne revient plus dans le bandeau, la page la montre toujours */
    dismissed: boolean;
  };
  /** Version installée depuis le dernier lancement : le bandeau « Bosco X installé » l'annonce une fois */
  installed: null | string;
}
