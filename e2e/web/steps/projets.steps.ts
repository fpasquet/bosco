// Phrases des projets choisis : des dossiers du dossier personnel du scénario, ajoutés comme le ferait la personne.
import type { DataTable } from 'playwright-bdd';
import { addProjects, createFolders } from '../../shared/projects.ts';
import { Given } from './fixtures.ts';

Given('le dossier {texte} est un projet', async ({ bosco }, folder: string) => {
  await addProjects(bosco, [folder]);
});

Given('les dossiers {texte} et {texte} sont des projets', async ({ bosco }, first: string, second: string) => {
  await addProjects(bosco, [first, second]);
});

Given('le dossier personnel contient les dossiers :', ({ bosco }, table: DataTable) => {
  createFolders(
    bosco,
    table.hashes().map((row) => ({ folder: row.dossier ?? '', git: row.git === 'oui' })),
  );
});
