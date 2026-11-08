/** Téléphone appairé (E4a) : il accède à Bosco tant qu'il n'est pas retiré ; seul l'empreinte du jeton est gardée. */
export interface DeviceSnapshot {
  id: string;
  /** Navigateur et système du téléphone, d'après sa requête d'appairage */
  name: string;
  pairedAt: Date;
  tokenHash: string;
}
