// Phrases d'interface génériques, par rôle accessible ; les textes s'écrivent entre guillemets français.
import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';
import { defineParameterType } from 'playwright-bdd';
import { Then, When } from './fixtures.ts';

defineParameterType({ name: 'texte', regexp: /«([^»]{1,200})»/, transformer: (texte: string) => texte.trim() });

When("j'ouvre la page {texte}", async ({ page }, path: string) => {
  await page.goto(path);
});

When('je clique sur le bouton {texte}', async ({ page }, name: string) => {
  // Nom exact : « Accepter » ne désigne pas « Modifier avant d’accepter »
  await page.getByRole('button', { name, exact: true }).click();
});

When('je clique sur le lien {texte}', async ({ page }, name: string) => {
  await page.getByRole('link', { name }).click();
});

When('je recharge la page', async ({ page }) => {
  await page.reload();
});

Then('je ne vois plus le texte {texte}', async ({ page }, text: string) => {
  await expect(page.getByText(text)).toHaveCount(0);
});

Then('je suis sur la page {texte}', async ({ page }, path: string) => {
  await expect(page).toHaveURL((url) => url.pathname === path);
});

Then('je ne vois pas le bouton {texte}', async ({ page }, name: string) => {
  await expect(page.getByRole('button', { name })).toHaveCount(0);
});

Then('le bouton {texte} est enfoncé', async ({ page }, name: string) => {
  await expect(page.getByRole('button', { name, pressed: true })).toBeVisible();
});

Then('je vois le texte {texte}', async ({ page }, text: string) => {
  await expect(page.getByText(text)).toBeVisible();
});

Then('je finis par ne plus voir le bouton {texte}', async ({ page }, name: string) => {
  await expect(page.getByRole('button', { name })).toHaveCount(0);
});

/** Contrôle automatisé WCAG 2.2 A et AA de ce qui est affiché. */
Then('la page est accessible', async ({ page }) => {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  // Les éléments en cause accompagnent chaque règle, pour corriger sans relancer
  const found = violations.map(({ help, id, nodes }) =>
    [id, help, nodes.map((node) => node.target.join(' ')).join(', ')].join(' · '),
  );
  expect(found).toEqual([]);
});

Then('je vois le lien {texte}', async ({ page }, name: string) => {
  await expect(page.getByRole('link', { name })).toBeVisible();
});

Then('je vois le titre {texte}', async ({ page }, name: string) => {
  await expect(page.getByRole('heading', { name })).toBeVisible();
});

When('je choisis {texte} dans la liste {texte}', async ({ page }, option: string, label: string) => {
  await page.getByLabel(label).selectOption({ label: option });
});

When('je bascule l’interrupteur {texte}', async ({ page }, label: string) => {
  await page.getByRole('switch', { name: label }).click();
});

Then('la liste {texte} vaut {texte}', async ({ page }, label: string, option: string) => {
  await expect(page.getByLabel(label).locator('option:checked')).toHaveText(option);
});

Then('l’interrupteur {texte} est {texte}', async ({ page }, label: string, state: string) => {
  const toggle = page.getByRole('switch', { name: label });
  await (state === 'activé' ? expect(toggle).toBeChecked() : expect(toggle).not.toBeChecked());
});

Then('le bouton {texte} est désactivé', async ({ page }, name: string) => {
  await expect(page.getByRole('button', { name })).toBeDisabled();
});

Then('je vois le message {texte}', async ({ page }, text: string) => {
  await expect(page.getByRole('status').filter({ hasText: text })).toBeVisible();
});

When('je coche {texte}', async ({ page }, label: string) => {
  // Case enregistrée côté Bosco : elle se coche à sa réponse
  const box = page.getByRole('checkbox', { name: label });
  await box.click();
  await expect(box).toBeChecked();
});

Then('la case {texte} est cochée', async ({ page }, label: string) => {
  await expect(page.getByRole('checkbox', { name: label })).toBeChecked();
});

When('je clique sur le bouton radio {texte}', async ({ page }, label: string) => {
  const radio = page.getByRole('radio', { name: label });
  await radio.click();
  await expect(radio).toBeChecked();
});
