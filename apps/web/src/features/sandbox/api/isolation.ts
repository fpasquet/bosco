import type { IsolationDto, QuotaDto, QuotaScopeDto, QuotaThresholdsDto, SourcesDto } from '@bosco/domain';

/** Réglage refusé par l'API : son message s'affiche sous le champ. */
export class IsolationRefused extends Error {}

/** Isolation des bacs à sable et abonnement Claude par défaut. */
export const isolationQuery = {
  queryKey: ['isolation'],
  queryFn: async () => {
    const response = await fetch('/api/isolation');
    if (!response.ok) throw new Error(`GET /api/isolation answered ${response.status}`);
    return (await response.json()) as IsolationDto;
  },
};

/** Profils surveillés : celui de l'abonnement par défaut ouvre ses réglages par son identifiant. */
export const profilesQuery = {
  queryKey: ['sources'],
  queryFn: async () => {
    const response = await fetch('/api/sources');
    if (!response.ok) throw new Error(`GET /api/sources answered ${response.status}`);
    return (await response.json()) as SourcesDto;
  },
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
/** Abonnement Claude par défaut : celui que prend une nouvelle session. */
export const setSubscription = (profile: null | string) => change('PUT', '/api/isolation/subscription', { profile });

/** Quota de l'abonnement : l'usage de chaque abonnement, les seuils et leur portée. */
export const quotaQuery = {
  queryKey: ['quota'],
  queryFn: async (): Promise<QuotaDto> => {
    const response = await fetch('/api/quota');
    if (!response.ok) throw new Error(`GET /api/quota answered ${response.status}`);
    return (await response.json()) as QuotaDto;
  },
  refetchInterval: 30_000,
};

/** Seuils refusés : le message dit pourquoi. */
export class QuotaRefused extends Error {}

export async function setQuotaThresholds(thresholds: QuotaThresholdsDto): Promise<QuotaDto> {
  const response = await fetch('/api/quota/thresholds', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(thresholds),
  });
  if (response.status === 400) {
    const { message } = (await response.json()) as { message?: string };
    throw new QuotaRefused(message ?? 'Seuils refusés.');
  }
  if (!response.ok) throw new Error(`PUT /api/quota/thresholds answered ${response.status}`);
  return (await response.json()) as QuotaDto;
}

/** Sessions retenues par les seuils : en bac à sable seulement, ou aussi pilotées sur le poste. */
export async function setQuotaScope(scope: QuotaScopeDto): Promise<QuotaDto> {
  const response = await fetch('/api/quota/scope', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ scope }),
  });
  if (!response.ok) throw new Error(`PUT /api/quota/scope answered ${response.status}`);
  return (await response.json()) as QuotaDto;
}
