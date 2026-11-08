import { useSyncExternalStore } from 'react';

/** Écran de téléphone : en dessous du point de rupture md de Tailwind (48rem). */
const PHONE = '(max-width: 767px)';

function subscribe(onChange: () => void): () => void {
  const query = globalThis.matchMedia?.(PHONE);
  query?.addEventListener('change', onChange);
  return () => query?.removeEventListener('change', onChange);
}

/** Vrai sur un écran de téléphone, et suit les changements de largeur ; faux au rendu côté serveur. */
export function useIsPhone(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => globalThis.matchMedia?.(PHONE).matches ?? false,
    () => false,
  );
}
