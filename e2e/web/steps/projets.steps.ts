// Phrases des projets choisis et de leurs groupes : des dossiers du dossier personnel du scénario, ajoutés comme le
// ferait la personne, puis réunis en groupes.
import type { DataTable } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { join } from 'node:path';
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

Given(
  'le groupe {texte} réunit les projets {texte} et {texte}',
  async ({ bosco }, group: string, first: string, second: string) => {
    await addGroup(bosco, group, [first, second]);
  },
);

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

Given(
  'la session pilotée {texte} tourne dans les projets {texte}',
  async ({ bosco }, text: string, folders: string) => {
    // Démarrée comme le ferait le formulaire, le premier projet étant le principal ; le tour du faux Claude Code se joue
    const [principal = '', ...others] = folders.split(',').map((folder) => join(bosco.profilesRoot, folder.trim()));
    const response = await fetch(`${bosco.url}/api/pilot/sessions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        images: [],
        profile: join(bosco.profilesRoot, '.claude-perso'),
        project: principal,
        projects: others,
        settings: { effort: null, model: null, permissionMode: 'acceptEdits' },
        text,
      }),
    });
    expect(response.status).toBe(201);
    const { sessionId } = (await response.json()) as { sessionId: string };
    await expect
      .poll(async () => {
        const detail = await fetch(`${bosco.url}/api/sessions/${sessionId}`);
        const body = (await detail.json()) as { session: { pilot: null | { running: boolean } } };
        return body.session.pilot?.running;
      })
      .toBe(false);
  },
);
