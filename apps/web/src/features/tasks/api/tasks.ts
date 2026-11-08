import type { TaskDraftDto, TaskDto, TaskIssueDto, WorkerStatusDto } from '@bosco/domain';

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
