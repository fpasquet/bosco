import type {
  LinkDto,
  LinkServiceDto,
  RightsDto,
  RightsFieldDto,
  TaskChangesDto,
  TaskDraftDto,
  TaskDto,
  TaskIssueDto,
  TaskReviewDto,
  ValidationDto,
  WorkerStatusDto,
} from '@bosco/domain';

async function read<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`GET ${path} answered ${response.status}`);
  return (await response.json()) as T;
}

/** Erreurs du formulaire renvoyées par l'API (400), chacune liée à son champ (E6b). */
export class TaskIssues extends Error {
  constructor(readonly issues: TaskIssueDto[]) {
    super(issues.map((issue) => issue.message).join(' '));
  }
}

async function send(method: 'POST' | 'PUT', path: string, body?: unknown): Promise<TaskDto> {
  const response = await fetch(path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  if (response.status === 400) {
    const { issues } = (await response.json()) as { issues?: TaskIssueDto[] };
    throw new TaskIssues(issues ?? []);
  }
  if (!response.ok) throw new Error(`${path} answered ${response.status}`);
  return (await response.json()) as TaskDto;
}

export const tasksQuery = {
  queryKey: ['tasks'],
  queryFn: async () => (await read<{ tasks: TaskDto[] }>('/api/tasks')).tasks,
  staleTime: Number.POSITIVE_INFINITY,
};

export const repositoriesQuery = {
  queryKey: ['repositories'],
  queryFn: async () =>
    (await read<{ repositories: { name: string; root: string }[] }>('/api/repositories')).repositories,
};

export const cancellationQuery = (id: number) => ({
  queryKey: ['task-cancellation', id],
  queryFn: async () => (await read<{ failing: TaskDto[] }>(`/api/tasks/${id}/cancellation`)).failing,
});

/** État du worker, relu à cet intervalle : il revérifie seul (E5c). */
export const workerQuery = {
  queryKey: ['worker'],
  queryFn: () => read<WorkerStatusDto>('/api/worker'),
  refetchInterval: 5000,
};

/** « Réessayer » : le worker revérifie Docker et l'abonnement tout de suite (CA-TACH-16). */
export async function checkWorker(): Promise<WorkerStatusDto> {
  const response = await fetch('/api/worker/check', { method: 'POST' });
  if (!response.ok) throw new Error(`POST /api/worker/check answered ${response.status}`);
  return (await response.json()) as WorkerStatusDto;
}

export const createTask = (draft: TaskDraftDto) => send('POST', '/api/tasks', draft);
export const editTask = (id: number, draft: TaskDraftDto) => send('PUT', `/api/tasks/${id}`, draft);
export const cancelTask = (id: number) => send('POST', `/api/tasks/${id}/cancel`);
export const relaunchTask = (id: number, changes: { budgetUsd: number; fromBranch: boolean; instruction?: string }) =>
  send('POST', `/api/tasks/${id}/relaunch`, changes);

/** Droits des agents d'un dépôt, ou les réglages généraux sans dépôt (E8a). */
export const rightsQuery = (repository: null | string) => ({
  queryKey: ['rights', repository ?? ''],
  queryFn: () =>
    read<RightsDto>(repository ? `/api/rights?repository=${encodeURIComponent(repository)}` : '/api/rights'),
});

/** Droits refusés (400) : le message s'affiche sous la ligne. */
export class RightsRefused extends Error {}

export async function updateRights(repository: null | string, changes: Partial<Record<RightsFieldDto, unknown>>) {
  const path = repository ? `/api/rights/repositories/${encodeURIComponent(repository)}` : '/api/rights/general';
  const response = await fetch(path, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(changes),
  });
  if (response.status === 400) {
    const { message } = (await response.json()) as { message?: string };
    throw new RightsRefused(message ?? 'Droits refusés.');
  }
  if (!response.ok) throw new Error(`PUT ${path} answered ${response.status}`);
  return (await response.json()) as RightsDto;
}

export const changesQuery = (id: number) => ({
  queryKey: ['task-changes', id],
  queryFn: () => read<TaskChangesDto>(`/api/tasks/${id}/changes`),
});

export const reviewQuery = (id: number) => ({
  queryKey: ['task-review', id],
  queryFn: () => read<TaskReviewDto>(`/api/tasks/${id}/review`),
});

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`POST ${path} answered ${response.status}`);
  return (await response.json()) as T;
}

/** Valider, avec la PR brouillon demandée ou sans (E7c) ; un envoi en échec laisse la tâche validée. */
export const validateTask = (id: number, pullRequest: null | { body: string; title: string }) =>
  post<ValidationDto>(`/api/tasks/${id}/validate`, { pullRequest });

export const retryPullRequest = (id: number, pullRequest: { body: string; title: string }) =>
  post<ValidationDto>(`/api/tasks/${id}/pull-request`, pullRequest);

export const rejectTask = (id: number, values: { reason: string; relaunch: boolean }) =>
  post<TaskDto>(`/api/tasks/${id}/reject`, values);

export const linksQuery = (id: number) => ({
  queryKey: ['task-links', id],
  queryFn: async () => (await read<{ links: LinkDto[] }>(`/api/tasks/${id}/links`)).links,
});

/** Service reconnu d'une adresse collée, avant l'ajout (CA-CONT-34). */
export const recognizeQuery = (url: string) => ({
  queryKey: ['recognize', url],
  queryFn: () => read<{ kind: string; service: LinkServiceDto }>(`/api/links/recognize?url=${encodeURIComponent(url)}`),
});

/** Lien refusé (400) : le message s'affiche sous le champ. */
export class LinkRefused extends Error {}

export async function addLink(id: number, url: string): Promise<LinkDto> {
  const response = await fetch(`/api/tasks/${id}/links`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (response.status === 400) {
    const { message } = (await response.json()) as { message?: string };
    throw new LinkRefused(message ?? 'Lien refusé.');
  }
  if (!response.ok) throw new Error(`POST links answered ${response.status}`);
  return (await response.json()) as LinkDto;
}

export async function removeLink(id: number, link: number): Promise<void> {
  const response = await fetch(`/api/tasks/${id}/links/${link}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`DELETE link answered ${response.status}`);
}
