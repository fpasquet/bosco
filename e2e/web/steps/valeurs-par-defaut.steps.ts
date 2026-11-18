// Phrases des valeurs par défaut des sessions et des modes d'autorisation : réglées comme dans les réglages d'un
// profil, d'un projet ou d'un groupe, puis lues dans la barre d'outils.
import type { DataTable } from 'playwright-bdd';
import { expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { setDefaults } from '../../shared/projects.ts';
import { Given, Then, When } from './fixtures.ts';

/** Modes et efforts tels que les dit la personne, et leur nom dans Bosco */
const VALUES: Record<string, string> = {
  Demander: 'ask',
  'Accepter les modifications': 'acceptEdits',
  Plan: 'plan',
  'Approuver pour moi': 'auto',
  'Accès complet': 'bypassPermissions',
  'Sonnet 5.5': 'claude-sonnet-5-5',
  'Haiku 4.5': 'claude-haiku-4-5',
  élevé: 'high',
  moyen: 'medium',
};

const valueOf = (said: string) => VALUES[said] ?? said;

Given('le groupe {texte} part par défaut en {texte}', async ({ bosco }, group: string, mode: string) => {
  await setDefaults(bosco, 'group', group, { permissionMode: valueOf(mode) });
});

Given('le groupe {texte} prend par défaut le profil {texte}', async ({ bosco }, group: string, profile: string) => {
  await setDefaults(bosco, 'group', group, { profile: join(bosco.profilesRoot, profile) });
});

Given(
  'le projet {texte} règle par défaut le modèle {texte} et l’effort {texte}',
  async ({ bosco }, project: string, model: string, effort: string) => {
    await setDefaults(bosco, 'project', project, { effort: valueOf(effort), model: valueOf(model) });
  },
);

Given('le profil Claude Code {texte} règle le modèle {texte}', ({ bosco }, profile: string, model: string) => {
  mkdirSync(join(bosco.profilesRoot, profile), { recursive: true });
  writeFileSync(join(bosco.profilesRoot, profile, 'settings.json'), JSON.stringify({ model: valueOf(model) }));
});

/** Un réglage de la barre d'outils, par le début de son nom (« Autorisations : … ») : la puce visible seulement. */
const setting = (page: Page, label: string) =>
  page.getByRole('button', { name: new RegExp(`^${label}( par défaut)? :`) });

When('j’ouvre le menu des réglages {texte}', async ({ page }, label: string) => {
  await setting(page, label).click();
});

When('je choisis {texte} dans le menu des réglages {texte}', async ({ page }, option: string, label: string) => {
  await setting(page, label).click();
  await page.getByRole('menuitemradio', { name: new RegExp(`^${option}`) }).click();
});

Then('le réglage {texte} vaut {texte}', async ({ page }, label: string, value: string) => {
  await expect(setting(page, label)).toHaveAccessibleName(`${label} : ${value}`);
});

Then('le choix {texte} du menu est grisé, avec sa raison {texte}', async ({ page }, option: string, reason: string) => {
  const item = page.getByRole('menuitemradio', { name: new RegExp(`^${option}`) });
  await expect(item).toBeDisabled();
  await expect(item).toContainText(reason);
});

Then('le menu propose les modes, dans l’ordre :', async ({ page }, table: DataTable) => {
  const modes = table.raw().map(([mode]) => mode ?? '');
  const items = page.getByRole('menu').getByRole('menuitemradio');
  await expect(items).toHaveCount(modes.length);
  for (const [index, mode] of modes.entries()) await expect(items.nth(index)).toContainText(mode);
});
