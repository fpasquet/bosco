import type {
  ArchitectureDto,
  ContextDto,
  ContextPreviewDto,
  DecisionDetailDto,
  DecisionDto,
  DecisionTargetDto,
  DecisionTextDto,
  IntegrationsDto,
  SocleDto,
} from '@bosco/domain';

async function read<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`GET ${path} answered ${response.status}`);
  return (await response.json()) as T;
}

/** Changement refusé (400) : le message s'affiche sous le champ en cause. */
export class ContextRefused extends Error {}

async function send<T>(method: 'POST' | 'PUT', path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  if (response.status === 400) {
    const { message } = (await response.json()) as { message?: string };
    throw new ContextRefused(message ?? 'Changement refusé.');
  }
  if (!response.ok) throw new Error(`${method} ${path} answered ${response.status}`);
  return (await response.json()) as T;
}

export const contextQuery = (repository: string) => ({
  queryKey: ['context', repository],
  queryFn: () => read<ContextDto>(`/api/context?repository=${encodeURIComponent(repository)}`),
});

export const previewQuery = (repository: string) => ({
  queryKey: ['context-preview', repository],
  queryFn: () => read<ContextPreviewDto>(`/api/context/preview?repository=${encodeURIComponent(repository)}`),
  staleTime: 0,
});

export const proposalsQuery = {
  queryKey: ['context-proposals'],
  queryFn: async () => (await read<{ proposals: DecisionDto[] }>('/api/context/proposals')).proposals,
  refetchInterval: 15_000,
};

export const decisionQuery = (id: number) => ({
  queryKey: ['decision', id],
  queryFn: () => read<DecisionDetailDto>(`/api/decisions/${id}`),
});

export const soclesQuery = {
  queryKey: ['socles'],
  queryFn: async () => (await read<{ socles: SocleDto[] }>('/api/socles')).socles,
};

export const writeDecision = (body: {
  accept: boolean;
  exceptionTo: null | number;
  replaces: null | number;
  target: DecisionTargetDto;
  text: DecisionTextDto;
}) => send<DecisionDto>('POST', '/api/decisions', body);

export const acceptDecision = (id: number, edited: DecisionTextDto | null) =>
  send<DecisionDto>('POST', `/api/decisions/${id}/accept`, { edited });
export const refuseDecision = (id: number, reason: null | string) =>
  send<DecisionDto>('POST', `/api/decisions/${id}/refuse`, { reason });
export const editDecision = (id: number, text: DecisionTextDto, note: string) =>
  send<DecisionDto>('POST', `/api/decisions/${id}/versions`, { text, note });
export const abandonDecision = (id: number, reason: null | string) =>
  send<DecisionDto>('POST', `/api/decisions/${id}/abandon`, { reason });
export const saveArchitecture = (repository: string, architecture: ArchitectureDto) =>
  send<ArchitectureDto>('PUT', `/api/context/architecture/${encodeURIComponent(repository)}`, architecture);
export const saveSocle = (
  id: null | number,
  socle: { inherits: null | number; name: string; repositories: string[]; scope: 'global' | 'shared' },
) => send<SocleDto>(id === null ? 'POST' : 'PUT', id === null ? '/api/socles' : `/api/socles/${id}`, socle);

/** Dépôts connus du poste, d'après les sessions surveillées. */
export const repositoriesQuery = {
  queryKey: ['repositories'],
  queryFn: async () =>
    (await read<{ repositories: { name: string; root: string }[] }>('/api/repositories')).repositories,
};

/** Dépôts qui ont une décision à eux, proposée ou acceptée : le choix de l'écran du contexte. */
export const decidedRepositoriesQuery = {
  queryKey: ['context-repositories'],
  queryFn: async () => (await read<{ repositories: string[] }>('/api/context/repositories')).repositories,
};

export const integrationsQuery = {
  queryKey: ['integrations'],
  queryFn: () => read<IntegrationsDto>('/api/integrations'),
  refetchInterval: 30_000,
};

export async function configureIntegration(
  name: 'confluence' | 'jira',
  access: { baseUrl: string; email: string; token: string },
): Promise<void> {
  const response = await fetch(`/api/integrations/${name}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(access),
  });
  if (response.status === 400) {
    const { message } = (await response.json()) as { message?: string };
    throw new ContextRefused(message ?? 'Accès refusé.');
  }
  if (!response.ok) throw new Error(`PUT integration answered ${response.status}`);
}

export async function refreshLinks(): Promise<void> {
  const response = await fetch('/api/integrations/refresh', { method: 'POST' });
  if (!response.ok) throw new Error(`POST refresh answered ${response.status}`);
}
