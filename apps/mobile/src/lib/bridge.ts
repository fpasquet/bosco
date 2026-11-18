// Ce qui passe entre la vue web et l'application : les messages de la page, et la page qu'ouvre une
// notification touchée.

/** Message de la vue web : une notification de Bosco, ou l'ouverture des réglages de l'application. */
export type BridgeMessage =
  { body: string; path: string; title: string; type: 'notification'; urgent: boolean } | { type: 'app-settings' };

export function parseBridgeMessage(data: string): BridgeMessage | null {
  try {
    const message = JSON.parse(data) as Partial<BridgeMessage>;
    if (message.type === 'app-settings') return { type: 'app-settings' };
    if (message.type === 'notification' && typeof message.title === 'string' && typeof message.path === 'string')
      return {
        type: 'notification',
        title: message.title,
        body: typeof message.body === 'string' ? message.body : '',
        path: message.path,
        urgent: message.urgent === true,
      };
  } catch {
    // message d'une autre origine
  }
  return null;
}

/** Page de Bosco que garde une notification locale (« /sessions/c41e9a07 ») ; null sans elle. */
export function notificationPath(data: unknown): null | string {
  const path = (data as undefined | { path?: unknown })?.path;
  return typeof path === 'string' && path ? path : null;
}

/**
 * Adresse à donner à la vue web pour ouvrir une page : elle change à chaque fois, sinon la vue web ne recharge pas
 * la même page au retour de l'arrière-plan.
 */
export function pageUrl(url: string, path: string, stamp: number): string {
  const separator = path.includes('?') ? '&' : '?';
  return `${url}${path}${separator}from=${stamp}`;
}
