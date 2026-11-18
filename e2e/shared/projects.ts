// Projets des scénarios : des dossiers du dossier personnel du scénario, ajoutés comme le ferait la personne.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Bosco } from './bosco.ts';

/** Ajoute des dossiers (« labo-ia », « www/site-clubs ») comme projets ; un dossier qui manque est créé, sans git. */
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
