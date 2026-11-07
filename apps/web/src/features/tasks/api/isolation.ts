import type { IsolationDto } from '@bosco/domain';

/** Réglage refusé par l'API (400) : son message s'affiche sous le champ. */
export class IsolationRefused extends Error {}

/** Isolation du worker, relue à cet intervalle : les refus arrivent pendant que les tâches tournent (E11b). */
export const isolationQuery = {
  queryKey: ['isolation'],
  queryFn: async () => {
    const response = await fetch('/api/isolation');
    if (!response.ok) throw new Error(`GET /api/isolation answered ${response.status}`);
    return (await response.json()) as IsolationDto;
  },
  refetchInterval: 5000,
};

async function change(method: 'DELETE' | 'POST' | 'PUT', path: string, body?: unknown): Promise<IsolationDto> {
  const response = await fetch(path, {
    method,
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 400) {
    const { message } = (await response.json()) as { message?: string };
    throw new IsolationRefused(message ?? 'Réglage refusé.');
  }
  if (!response.ok) throw new Error(`${method} ${path} answered ${response.status}`);
  return (await response.json()) as IsolationDto;
}

export const addDomain = (domain: string) => change('POST', '/api/isolation/domains', { domain });
export const removeDomain = (domain: string) =>
  change('DELETE', `/api/isolation/domains/${encodeURIComponent(domain)}`);
export const setMaxAgents = (maxAgents: number) => change('PUT', '/api/isolation/capacity', { maxAgents });
