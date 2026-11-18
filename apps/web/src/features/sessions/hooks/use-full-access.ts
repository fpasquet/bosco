import { useState } from 'react';

/** Ce qui attend la confirmation de l'accès complet : un choix du menu, ou le démarrage d'une session. */
interface Pending {
  apply: () => Promise<void> | void;
  /** Le démarrage est annulé : le message reste dans la zone de saisie */
  reject?: (error: Error) => void;
}

/**
 * Confirmation de l'accès complet sur le poste : quand on le choisit dans le menu, ou au démarrage quand il vient
 * d'un réglage par défaut ; à chaque session, jamais une fois pour toutes.
 */
export function useFullAccess() {
  const [pending, setPending] = useState<null | Pending>(null);
  return {
    open: pending !== null,
    /** Un choix à appliquer une fois confirmé */
    ask: (apply: () => void) => setPending({ apply }),
    /** Un démarrage qui attend la confirmation ; annulé, la promesse échoue et le message reste */
    askBeforeStart: (start: () => Promise<void>) =>
      new Promise<void>((resolve, reject) => setPending({ apply: () => start().then(resolve, reject), reject })),
    confirm: () => {
      const confirmed = pending;
      setPending(null);
      void confirmed?.apply();
    },
    cancel: () => {
      pending?.reject?.(new Error('Accès complet non confirmé'));
      setPending(null);
    },
  };
}
