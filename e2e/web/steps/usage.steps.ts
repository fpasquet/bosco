import { expect } from '@playwright/test';
// Phrases de la page Usage (E23a, E23b) : le graphique quotidien, sa vue en tableau et le quota des abonnements.
import { join } from 'node:path';
import { Given, Then, When } from './fixtures.ts';

Given(
  'l’abonnement du profil {texte} est à {int} % de sa fenêtre de 5 h',
  async ({ bosco }, profile: string, percent: number) => {
    const response = await fetch(`${bosco.url}/__test/quota`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fiveHour: percent, profile: join(bosco.profilesRoot, profile) }),
    });
    expect(response.ok).toBe(true);
  },
);

When('je place le focus sur le jour {texte} du graphique', async ({ page }, day: string) => {
  // Sur le poste comme sur le téléphone, un seul graphique est visible
  await page
    .getByRole('button', { name: new RegExp(`^${day}`) })
    .filter({ visible: true })
    .focus();
});

Then('l’info-bulle du graphique dit {texte}', async ({ page }, text: string) => {
  await expect(page.getByRole('tooltip')).toContainText(text);
});

Then('je vois le tableau {texte}', async ({ page }, name: string) => {
  await expect(page.getByRole('table', { name })).toBeVisible();
});

Then('la légende du graphique montre {texte}', async ({ page }, names: string) => {
  const legend = page.getByRole('list', { name: 'Légende' });
  for (const name of names.split(', ')) await expect(legend.getByText(name, { exact: true })).toBeVisible();
});

Then('la jauge {texte} du quota vaut {texte}', async ({ page }, name: string, value: string) => {
  await expect(page.getByRole('meter', { name: `${name} : ${value}` }).first()).toBeVisible();
});
