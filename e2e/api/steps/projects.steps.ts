// Phrases des projets choisis : des dossiers ajoutés par la personne, et le dossier personnel que parcourt Bosco.
import type { DataTable } from 'playwright-bdd';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { addProjects, createFolders } from '../../shared/projects.ts';
import { Given, When } from './fixtures.ts';

const list = (folders: string) =>
  folders
    .split(',')
    .map((folder) => folder.trim())
    .filter(Boolean);

Given('the folder {string} is a project', async ({ bosco }, folder: string) => {
  await addProjects(bosco, [folder]);
});

Given('the folders {string} are projects', async ({ bosco }, folders: string) => {
  await addProjects(bosco, list(folders));
});

Given('the home folder has the folders:', ({ bosco }, table: DataTable) => {
  createFolders(
    bosco,
    table.hashes().map((row) => ({ folder: row.folder ?? '', git: row.git === 'yes' })),
  );
});

Given('the folder {string} has the file {string}', ({ bosco }, folder: string, file: string) => {
  mkdirSync(join(bosco.profilesRoot, folder), { recursive: true });
  writeFileSync(join(bosco.profilesRoot, folder, file), '{}\n');
});

When('I browse the home folder', async ({ last, request }) => {
  const response = await request.get('/api/folders');
  last.response = { status: response.status(), body: (await response.json()) as unknown };
});

When('I browse the folder {string}', async ({ bosco, last, request }, folder: string) => {
  const path = folder.startsWith('/') ? folder : join(bosco.profilesRoot, folder);
  const response = await request.get(`/api/folders?path=${encodeURIComponent(path)}`);
  last.response = { status: response.status(), body: (await response.json()) as unknown };
});
