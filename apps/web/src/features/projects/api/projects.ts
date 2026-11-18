import type { FolderListingDto, ProjectDto, ProjectsDto } from '@bosco/domain';

/** Refus de Bosco (dossier déjà ajouté, introuvable), avec son message. */
export class ProjectRefused extends Error {}

async function read<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`GET ${path} answered ${response.status}`);
  return (await response.json()) as T;
}

async function send(path: string, body: unknown): Promise<Response> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (response.status >= 400 && response.status < 500) {
    const { message } = (await response.json().catch(() => ({}))) as { message?: string };
    throw new ProjectRefused(message ?? 'Bosco a refusé ce changement.');
  }
  if (!response.ok) throw new Error(`POST ${path} answered ${response.status}`);
  return response;
}

/** Tous les projets : projets, sessions hors projet et dossiers proposés. */
export const projectsOverviewQuery = {
  queryKey: ['projects', 'overview'],
  queryFn: () => read<ProjectsDto>('/api/projects'),
};

/** Un dossier du navigateur ; null : le dossier personnel. */
export const folderQuery = (path: null | string) => ({
  queryKey: ['folders', path],
  queryFn: () => read<FolderListingDto>(path ? `/api/folders?path=${encodeURIComponent(path)}` : '/api/folders'),
});

export async function addProjects(paths: readonly string[]): Promise<ProjectDto[]> {
  const response = await send('/api/projects', { paths });
  const { projects } = (await response.json()) as { projects: ProjectDto[] };
  return projects;
}

export async function ignoreSuggestion(path: string): Promise<void> {
  await send('/api/projects/suggestions/ignore', { path });
}

export async function restoreSuggestion(path: string): Promise<void> {
  await send('/api/projects/suggestions/restore', { path });
}
