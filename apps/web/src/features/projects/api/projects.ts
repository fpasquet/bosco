import type {
  ContextDto,
  DecisionDto,
  FolderListingDto,
  ProjectDetailDto,
  ProjectDto,
  ProjectPlaceDto,
  ProjectsDto,
  SessionDefaultsDto,
  SessionDto,
} from '@bosco/domain';

/** Refus de Bosco (dossier déjà ajouté, introuvable, session qui tourne), avec le texte à montrer. */
export class ProjectRefused extends Error {}

/** Codes des refus de l'API qui ont un texte pour la personne ; les autres gardent le message de Bosco. */
const PROJECT_ERRORS: Record<string, string> = {
  invalidProjectDomain: 'Un nom de domaine seul, sans protocole ni chemin : pypi.org ou *.github.com.',
  invalidStartBranch: 'Ce nom de branche n’est pas valable pour git.',
  projectDomainTaken: 'Ce domaine est déjà dans la liste du projet.',
  projectHasRunningSession: 'Une session pilotée par Bosco tourne encore dans ce projet.',
  unknownProject: 'Ce projet a été retiré.',
};

async function read<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`GET ${path} answered ${response.status}`);
  return (await response.json()) as T;
}

async function send(path: string, body?: unknown, method: 'DELETE' | 'PATCH' | 'POST' = 'POST'): Promise<Response> {
  const response = await fetch(path, {
    method,
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status >= 400 && response.status < 500) {
    const { code, message } = (await response.json().catch(() => ({}))) as { code?: string; message?: string };
    throw new ProjectRefused((code && PROJECT_ERRORS[code]) ?? message ?? 'Bosco a refusé ce changement.');
  }
  if (!response.ok) throw new Error(`${method} ${path} answered ${response.status}`);
  return response;
}

/** Tous les projets : projets, sessions hors projet et dossiers proposés. */
export const projectsOverviewQuery = {
  queryKey: ['projects', 'overview'],
  queryFn: () => read<ProjectsDto>('/api/projects'),
};

/** Sessions lues par Bosco : celles hors de tout projet se listent sous « Hors projet ». */
export const sessionsQuery = {
  queryKey: ['sessions'],
  queryFn: async () => (await read<{ sessions: SessionDto[] }>('/api/sessions')).sessions,
};

/** Page d'un projet : le projet, sa branche courante et ses sessions pilotées qui tournent. */
export const projectQuery = (id: number) => ({
  queryKey: ['projects', 'detail', id],
  queryFn: () => read<ProjectDetailDto>(`/api/projects/${id}`),
});

/** Décisions proposées par un agent, en attente de validation : leur nombre suit « Contexte ». */
export const proposalsQuery = {
  queryKey: ['context-proposals'],
  queryFn: async () => (await read<{ proposals: DecisionDto[] }>('/api/context/proposals')).proposals,
  refetchInterval: 15_000,
};

/** Contexte d'un projet : ses décisions, gardées quand le projet est retiré. */
export const projectContextQuery = (name: string) => ({
  queryKey: ['context', name],
  queryFn: () => read<ContextDto>(`/api/context?project=${encodeURIComponent(name)}`),
});

/** Un dossier du navigateur ; null : le dossier personnel. */
export const folderQuery = (path: null | string) => ({
  queryKey: ['folders', path],
  queryFn: () => read<FolderListingDto>(path ? `/api/folders?path=${encodeURIComponent(path)}` : '/api/folders'),
});

/** Ajoute des dossiers comme projets, rangés à la suite dans un groupe s'il est choisi. */
export async function addProjects(paths: readonly string[], group: null | number = null): Promise<ProjectDto[]> {
  const response = await send('/api/projects', { paths, group });
  const { projects } = (await response.json()) as { projects: ProjectDto[] };
  return projects;
}

export async function ignoreSuggestion(path: string): Promise<void> {
  await send('/api/projects/suggestions/ignore', { path });
}

export async function restoreSuggestion(path: string): Promise<void> {
  await send('/api/projects/suggestions/restore', { path });
}

/** Épingler, désépingler, et les valeurs par défaut des sessions du projet ; vaut tout de suite. */
export async function changeProject(
  id: number,
  changes: {
    defaults?: Partial<SessionDefaultsDto>;
    pinned?: boolean;
    place?: null | ProjectPlaceDto;
    startBranch?: null | string;
  },
): Promise<ProjectDetailDto> {
  const response = await send(`/api/projects/${id}`, changes, 'PATCH');
  return (await response.json()) as ProjectDetailDto;
}

/** Un domaine propre au projet, ajouté à la liste générale pour ses bacs à sable ; vaut tout de suite. */
export async function addProjectDomain(id: number, domain: string): Promise<ProjectDetailDto> {
  const response = await send(`/api/projects/${id}/domains`, { domain });
  return (await response.json()) as ProjectDetailDto;
}

export async function removeProjectDomain(id: number, domain: string): Promise<ProjectDetailDto> {
  const response = await send(`/api/projects/${id}/domains/${encodeURIComponent(domain)}`, undefined, 'DELETE');
  return (await response.json()) as ProjectDetailDto;
}

/** Retire un projet de Bosco : rien n'est touché sur le poste. */
export async function removeProject(id: number): Promise<void> {
  await send(`/api/projects/${id}`, undefined, 'DELETE');
}
