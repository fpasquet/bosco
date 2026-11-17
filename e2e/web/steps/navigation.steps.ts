// Phrases de la navigation par lieux : fil d'Ariane, entrée active de la barre latérale, menus ⋯ et onglets.
import type { DataTable } from 'playwright-bdd';
import { expect, type Page } from '@playwright/test';
import { Given, Then, When } from './fixtures.ts';

const sidebar = (page: Page) => page.getByRole('complementary');

Given('le projet {texte} est épinglé', async ({ bosco }, name: string) => {
  const list = await fetch(`${bosco.url}/api/projects`);
  const { projects } = (await list.json()) as { projects: { id: number; name: string }[] };
  const project = projects.find((candidate) => candidate.name === name);
  if (!project) throw new Error(`No project ${name}`);
  const response = await fetch(`${bosco.url}/api/projects/${project.id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ pinned: true }),
  });
  if (!response.ok) throw new Error(`PATCH /api/projects/${project.id} answered ${response.status}`);
});

Then('le fil d’Ariane est {texte}', async ({ page }, trail: string) => {
  const items = page.getByRole('navigation', { name: 'Fil d’Ariane' }).getByRole('listitem');
  await expect(items).toHaveText(trail.split('›').map((part) => part.trim()));
});

Then('la page n’a pas de fil d’Ariane', async ({ page }) => {
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Fil d’Ariane' })).toHaveCount(0);
});

Then('l’entrée {texte} de la barre latérale est active', async ({ page }, name: string) => {
  await expect(sidebar(page).getByRole('link', { name }).first()).toHaveAttribute('aria-current', 'page');
});

Then('la barre latérale montre le projet {texte}', async ({ page }, name: string) => {
  await expect(page.getByRole('navigation', { name: 'Projets' }).getByRole('link', { name })).toBeVisible();
});

Then('la barre latérale ne montre pas le projet {texte}', async ({ page }, name: string) => {
  await expect(page.getByRole('navigation', { name: 'Projets' }).getByRole('link', { name })).toHaveCount(0);
});

When('je clique sur le lien {texte} de la barre latérale', async ({ page }, name: string) => {
  await sidebar(page).getByRole('link', { name }).first().click();
});

Then('je vois le lien {texte} dans la page', async ({ page }, name: string) => {
  await expect(page.getByRole('main').getByRole('link', { name, exact: true }).first()).toBeVisible();
});

When('je clique sur le lien {texte} de la page', async ({ page }, name: string) => {
  await page.getByRole('main').getByRole('link', { name, exact: true }).first().click();
});

When('j’ouvre au clavier le menu {texte}', async ({ page }, name: string) => {
  await page.getByRole('button', { name, exact: true }).focus();
  await page.keyboard.press('Enter');
});

Then('je vois l’élément de menu {texte}', async ({ page }, name: string) => {
  await expect(page.getByRole('menuitem', { name })).toBeVisible();
});

When('j’appuie sur Échap', async ({ page }) => {
  await page.keyboard.press('Escape');
});

Then('le menu propose, dans l’ordre :', async ({ page }, table: DataTable) => {
  const items = table.raw().map(([item]) => item ?? '');
  await expect(page.getByRole('menu').first().getByRole('menuitem')).toContainText(items);
});

Then('le menu est fermé', async ({ page }) => {
  await expect(page.getByRole('menu')).toHaveCount(0);
});

Then('la feuille propose, dans l’ordre :', async ({ page }, table: DataTable) => {
  const items = table.raw().map(([item]) => item ?? '');
  await expect(page.getByRole('dialog').getByRole('link')).toContainText(items);
});

Then('la feuille ne propose pas {texte}', async ({ page }, text: string) => {
  await expect(page.getByRole('dialog').getByText(text)).toHaveCount(0);
});

Then('les onglets {texte} sont {texte}', async ({ page }, label: string, names: string) => {
  const tabs = page.getByRole('navigation', { name: label }).getByRole('link');
  await expect(tabs).toHaveText(names.split(',').map((name) => name.trim()));
});

Then('l’onglet {texte} est ouvert', async ({ page }, name: string) => {
  await expect(page.getByRole('main').getByRole('link', { name, exact: true }).first()).toHaveAttribute(
    'aria-current',
    'page',
  );
});
