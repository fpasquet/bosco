import { create } from 'zustand';

/** Délai entre deux tentatives de reconnexion, sans action de la personne (CA-SESS-25). */
export const RETRY_MS = 5000;

/** État du lien avec Bosco (E1f) : la vue garde les dernières informations reçues, datées, tant qu'il est coupé. */
interface ConnectionState {
  /** Heure de la dernière information reçue du flux en direct */
  lastDataAt: null | string;
  markData: () => void;
  markOffline: (nextRetryAt: string) => void;
  markOnline: () => void;
  /** Prochaine tentative de reconnexion */
  nextRetryAt: null | string;
  /** Coupure détectée ; null tant que Bosco répond */
  offlineSince: null | string;
  /** Tentative immédiate (« Réessayer ») ; posée par le flux en direct */
  retry: () => void;
  setRetry: (retry: () => void) => void;
}

export const useConnection = create<ConnectionState>()((set, get) => ({
  lastDataAt: null,
  nextRetryAt: null,
  offlineSince: null,
  retry: () => undefined,
  markData: () => set({ lastDataAt: new Date().toISOString() }),
  markOffline: (nextRetryAt) => set({ nextRetryAt, offlineSince: get().offlineSince ?? new Date().toISOString() }),
  markOnline: () => set({ nextRetryAt: null, offlineSince: null }),
  setRetry: (retry) => set({ retry }),
}));

/** true quand Bosco ne répond plus : les réponses aux autorisations sont désactivées (CA-SESS-24). */
export const useOffline = () => useConnection((state) => state.offlineSince !== null);
