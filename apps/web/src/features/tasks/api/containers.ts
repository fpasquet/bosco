import type { ContainersDto } from '@bosco/domain';

/** Conteneurs en cours (E19), remplis par le flux en direct ; lus une fois avant son premier message. */
export const containersQuery = {
  queryKey: ['containers'],
  queryFn: async (): Promise<ContainersDto> => {
    const response = await fetch('/api/containers');
    if (!response.ok) throw new Error(`GET /api/containers answered ${response.status}`);
    return (await response.json()) as ContainersDto;
  },
};

async function act(method: 'DELETE' | 'POST', path: string): Promise<ContainersDto> {
  const response = await fetch(path, { method });
  if (!response.ok) throw new Error(`${method} ${path} answered ${response.status}`);
  return (await response.json()) as ContainersDto;
}

/** « Réessayer » quand Docker ne répond pas (CA-CONT-82). */
export const checkContainers = () => act('POST', '/api/containers/check');

/** Redémarre un service de test sans le recréer (E19b) ; la réponse arrive une fois le service prêt ou en échec. */
export const restartService = (name: string) => act('POST', `/api/containers/${encodeURIComponent(name)}/restart`);

/** « Supprimer » un conteneur resté, ou tous sans nom (E19d). */
export const removeLeftovers = (name?: string) =>
  act('DELETE', name ? `/api/containers/leftovers/${encodeURIComponent(name)}` : '/api/containers/leftovers');

/** Les 300 dernières lignes du journal d'un service de test. */
export async function serviceLogs(name: string): Promise<string> {
  const response = await fetch(`/api/containers/${encodeURIComponent(name)}/logs`);
  if (!response.ok) throw new Error(`GET logs of ${name} answered ${response.status}`);
  const { text } = (await response.json()) as { text: string };
  return text;
}

/** « Arrêter le tour » d'une session pilotée, comme dans son fil (E2g). */
export async function interruptTurn(sessionId: string): Promise<void> {
  const response = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}/interrupt`, { method: 'POST' });
  if (!response.ok) throw new Error(`POST interrupt answered ${response.status}`);
}
