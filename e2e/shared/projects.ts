// Projets des scénarios : des dossiers du dossier personnel du scénario, ajoutés comme le ferait la personne.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Bosco } from './bosco.ts';

/** Ajoute des dossiers (« maison », « www/site-clubs ») comme projets ; un dossier qui manque est créé, sans git. */
export async function addProjects(bosco: Bosco, folders: readonly string[]): Promise<void> {
  const paths = folders.map((folder) => join(bosco.profilesRoot, folder));
  for (const path of paths) mkdirSync(path, { recursive: true });
  const response = await fetch(`${bosco.url}/api/projects`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ paths }),
  });
  if (response.status !== 201) throw new Error(`POST /api/projects answered ${response.status}`);
}

/** Crée des dossiers dans le dossier personnel du scénario ; « git » en fait des dépôts. */
export function createFolders(bosco: Bosco, folders: readonly { folder: string; git: boolean }[]): void {
  for (const { folder, git } of folders)
    mkdirSync(join(bosco.profilesRoot, folder, ...(git ? ['.git'] : [])), { recursive: true });
}

async function call(bosco: Bosco, method: string, path: string, body?: unknown): Promise<unknown> {
  const response = await fetch(`${bosco.url}${path}`, {
    method,
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${method} ${path} answered ${response.status}`);
  return response.status === 204 ? null : await response.json();
}

/** Crée un groupe des projets nommés, dans l'ordre : le premier est le principal. */
export async function addGroup(bosco: Bosco, name: string, projects: readonly string[]): Promise<void> {
  const { projects: known } = (await call(bosco, 'GET', '/api/projects')) as {
    projects: { id: number; name: string }[];
  };
  const ids = projects.map((project) => {
    const found = known.find((candidate) => candidate.name === project);
    if (!found) throw new Error(`No project ${project}`);
    return found.id;
  });
  await call(bosco, 'POST', '/api/groups', { name, projects: ids });
}

/** Écrit les instructions d'un groupe, « Tous les projets » compris. */
export async function writeGroupInstructions(bosco: Bosco, name: string, instructions: string): Promise<void> {
  const { groups } = (await call(bosco, 'GET', '/api/groups')) as { groups: { id: number; name: string }[] };
  const group = groups.find((candidate) => candidate.name === name);
  if (!group) throw new Error(`No group ${name}`);
  await call(bosco, 'PUT', `/api/groups/${group.id}/instructions`, { instructions });
}

/** Règle les valeurs par défaut des sessions d'un projet ou d'un groupe, comme dans leurs réglages (E21a, E22a). */
export async function setDefaults(
  bosco: Bosco,
  level: 'group' | 'project',
  name: string,
  defaults: Record<string, null | string>,
): Promise<void> {
  if (level === 'group') {
    const { groups } = (await call(bosco, 'GET', '/api/groups')) as { groups: { id: number; name: string }[] };
    const group = groups.find((candidate) => candidate.name === name);
    if (!group) throw new Error(`No group ${name}`);
    await call(bosco, 'PATCH', `/api/groups/${group.id}`, { defaults });
    return;
  }
  const { projects } = (await call(bosco, 'GET', '/api/projects')) as { projects: { id: number; name: string }[] };
  const project = projects.find((candidate) => candidate.name === name);
  if (!project) throw new Error(`No project ${name}`);
  await call(bosco, 'PATCH', `/api/projects/${project.id}`, { defaults });
}
