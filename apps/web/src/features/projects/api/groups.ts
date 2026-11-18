import type {
  ContextPreviewDto,
  GroupDto,
  GroupsDto,
  SessionDefaultsDto,
  SessionDefaultsResolvedDto,
  SourcesDto,
} from '@bosco/domain';

/** Refus de Bosco (nom déjà pris, groupe inconnu), avec le texte à montrer. */
export class GroupRefused extends Error {
  constructor(readonly code: string) {
    super(GROUP_ERRORS[code] ?? 'Bosco a refusé ce changement.');
  }
}

/** Codes des refus de l'API, traduits pour la personne. */
const GROUP_ERRORS: Record<string, string> = {
  groupNameTaken: 'Un groupe porte déjà ce nom.',
  groupNameMissing: 'Donne un nom au groupe.',
  unknownGroup: 'Ce groupe n’existe plus.',
  unknownProject: 'Un de ces projets a été retiré.',
};

async function read<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`GET ${path} answered ${response.status}`);
  return (await response.json()) as T;
}

async function send<T>(method: 'DELETE' | 'PATCH' | 'POST' | 'PUT', path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status >= 400 && response.status < 500) {
    const { code } = (await response.json().catch(() => ({}))) as { code?: string };
    throw new GroupRefused(code ?? 'refused');
  }
  if (!response.ok) throw new Error(`${method} ${path} answered ${response.status}`);
  return (response.status === 204 ? undefined : await response.json()) as T;
}

/** Les groupes, « Tous les projets » en dernier. */
export const groupsQuery = {
  queryKey: ['groups'],
  queryFn: async () => (await read<GroupsDto>('/api/groups')).groups,
};

/** Profils Claude Code surveillés : ceux qu'un groupe peut prendre par défaut. */
export const profilesQuery = {
  queryKey: ['sources'],
  queryFn: () => read<SourcesDto>('/api/sources'),
};

/**
 * Ce dont hérite une nouvelle session d'un projet ou d'un groupe, avec l'origine de chaque valeur : ce que disent les
 * lignes « Hériter » de leurs réglages.
 */
export const inheritedDefaultsQuery = (level: { group: number } | { project: string }) => ({
  queryKey: ['pilot', 'defaults', 'level', level],
  queryFn: () => {
    const params = 'group' in level ? `group=${level.group}` : `project=${encodeURIComponent(level.project)}`;
    return read<SessionDefaultsResolvedDto>(`/api/pilot/defaults?${params}`);
  },
});

/** Texte transmis à un agent du projet, calculé à l'ouverture de l'aperçu. */
export const previewQuery = (project: string) => ({
  queryKey: ['context-preview', project],
  queryFn: () => read<ContextPreviewDto>(`/api/context/preview?project=${encodeURIComponent(project)}`),
  staleTime: 0,
});

export const createGroup = (group: { description: null | string; name: string; projects: number[] }) =>
  send<GroupDto>('POST', '/api/groups', group);

export const changeGroup = (
  id: number,
  settings: {
    defaults?: Partial<SessionDefaultsDto>;
    description?: null | string;
    name?: string;
    sidebar?: boolean;
  },
) => send<GroupDto>('PATCH', `/api/groups/${id}`, settings);

export const writeInstructions = (id: number, instructions: string) =>
  send<GroupDto>('PUT', `/api/groups/${id}/instructions`, { instructions });

export const arrangeProjects = (id: number, projects: number[]) =>
  send<GroupDto>('PUT', `/api/groups/${id}/projects`, { projects });

export const deleteGroup = (id: number) => send<undefined>('DELETE', `/api/groups/${id}`);
