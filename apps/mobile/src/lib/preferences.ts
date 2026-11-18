// Réglages de l'application, sans le trousseau qui les garde.

export interface AppPreferences {
  /** Rester connecté en arrière-plan, désactivé par défaut */
  background: boolean;
  vibrate: boolean;
}

export const DEFAULT_PREFERENCES: AppPreferences = { background: false, vibrate: true };

/** Réglages gardés dans le trousseau ; ceux qui manquent prennent leur valeur par défaut. */
export function readPreferences(stored: null | string): AppPreferences {
  return { ...DEFAULT_PREFERENCES, ...(stored ? (JSON.parse(stored) as Partial<AppPreferences>) : {}) };
}

/** Le service au premier plan, avec sa notification permanente, ne tourne qu'activé et avec un poste appairé. */
export function keepsAlive(preferences: AppPreferences, paired: boolean): boolean {
  return preferences.background && paired;
}
