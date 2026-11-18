import type { ContainersDto } from '@bosco/domain';

/** Conteneurs en cours, remplis par le flux en direct ; lus une fois avant son premier message. */
export const containersQuery = {
  queryKey: ['containers'],
  queryFn: async (): Promise<ContainersDto> => {
    const response = await fetch('/api/containers');
    if (!response.ok) throw new Error(`GET /api/containers answered ${response.status}`);
    return (await response.json()) as ContainersDto;
  },
};

async function act(method: 'POST', path: string): Promise<ContainersDto> {
  const response = await fetch(path, { method });
  if (!response.ok) throw new Error(`${method} ${path} answered ${response.status}`);
  return (await response.json()) as ContainersDto;
}

/** « Réessayer » quand Docker ne répond pas. */
export const checkContainers = () => act('POST', '/api/containers/check');

/** « Arrêter le tour » d'une session pilotée, comme dans son fil. */
export async function interruptTurn(sessionId: string): Promise<void> {
  const response = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}/interrupt`, { method: 'POST' });
  if (!response.ok) throw new Error(`POST interrupt answered ${response.status}`);
}
