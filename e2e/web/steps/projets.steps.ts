// Phrases des projets choisis et de leurs groupes : des dossiers du dossier personnel du scénario, ajoutés comme le
// ferait la personne, puis réunis en groupes.
import type { DataTable } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { addGroup, addProjects, createFolders, writeGroupInstructions } from '../../shared/projects.ts';
import { Given, Then, When } from './fixtures.ts';

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

Given('le groupe {texte} réunit le projet {texte}', async ({ bosco }, group: string, project: string) => {
  await addGroup(bosco, group, [project]);
});

Given('le groupe {texte} a l’instruction {texte}', async ({ bosco }, group: string, instruction: string) => {
  await writeGroupInstructions(bosco, group, instruction);
});

When('je clique sur l’élément de menu {texte}', async ({ page }, name: string) => {
  await page.getByRole('menuitem', { name }).click();
});

Then('la barre latérale ne montre pas le groupe {texte}', async ({ page }, name: string) => {
  await expect(page.getByRole('navigation', { name: 'Groupes' }).getByRole('link', { name })).toHaveCount(0);
});

Then('les onglets du groupe sont {texte}', async ({ page }, names: string) => {
  const tabs = page.getByRole('navigation', { name: 'Onglets du groupe' }).getByRole('link');
  await expect(tabs).toHaveText(names.split(',').map((name) => name.trim()));
});
