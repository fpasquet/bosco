// Phrases communes des listes, des choix et des confirmations.
import { expect } from '@playwright/test';
import { Then, When } from './fixtures.ts';

When('je clique sur le bouton {texte} de la confirmation', async ({ page }, name: string) => {
  await page.getByRole('alertdialog').getByRole('button', { name }).click();
});

Then('la liste {texte} contient {texte}', async ({ page }, label: string, item: string) => {
  await expect(page.getByRole('list', { name: label }).getByRole('listitem').filter({ hasText: item })).toBeVisible();
});

Then('la liste {texte} ne contient plus {texte}', async ({ page }, label: string, item: string) => {
  await expect(page.getByRole('listitem').filter({ hasText: item })).toHaveCount(0);
  await expect(page.getByRole('list', { name: label })).toBeHidden();
});

Then('la liste {texte} ne contient pas {texte}', async ({ page }, label: string, item: string) => {
  await expect(page.getByRole('list', { name: label }).getByRole('listitem').filter({ hasText: item })).toHaveCount(0);
});

Then('le choix {texte} propose {texte}', async ({ page }, label: string, options: string) => {
  await expect(page.getByRole('combobox', { name: label }).getByRole('option')).toHaveText(options.split(', '));
});
