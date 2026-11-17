import type {
  ArchitectureDto,
  ContextDto,
  ContextPreviewDto,
  DecisionDetailDto,
  DecisionDto,
  DecisionTargetDto,
  DecisionTextDto,
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

export const contextQuery = (project: string) => ({
  queryKey: ['context', project],
  queryFn: () => read<ContextDto>(`/api/context?project=${encodeURIComponent(project)}`),
});

export const previewQuery = (project: string) => ({
  queryKey: ['context-preview', project],
  queryFn: () => read<ContextPreviewDto>(`/api/context/preview?project=${encodeURIComponent(project)}`),
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

export const writeDecision = (body: {
  accept: boolean;
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
export const saveArchitecture = (project: string, architecture: ArchitectureDto) =>
  send<ArchitectureDto>('PUT', `/api/context/architecture/${encodeURIComponent(project)}`, architecture);
/** Projets ajoutés par la personne ; même clé que la liste des projets, qui les change. */
export const projectsQuery = {
  queryKey: ['projects', 'overview'],
  queryFn: () => read<{ projects: { id: number; name: string }[] }>('/api/projects'),
  select: (data: { projects: { id: number; name: string }[] }) => data.projects,
};
