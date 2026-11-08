// Phrases du téléphone : un navigateur de téléphone sur le réseau local, qui accepte le certificat de Bosco (DT-10).
import { devices, expect, type Page } from '@playwright/test';
import { Given, Then, When } from './fixtures.ts';

let phone: null | Page = null;
let code = '';

Given('l’accès depuis le téléphone est activé avec un code affiché sur le poste', async ({ bosco }) => {
  const enabled = await fetch(`${bosco.url}/api/phone-access`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ enabled: true }),
  });
  expect(enabled.ok).toBe(true);
  const issued = await fetch(`${bosco.url}/api/pairing/code`, { method: 'POST' });
  code = ((await issued.json()) as { code: string }).code;
});

When('le téléphone ouvre l’adresse du poste', async ({ bosco, browser }) => {
  // Le téléphone a accepté une fois l'avertissement du certificat créé par Bosco
  const context = await browser.newContext({ ...devices['Pixel 7'], ignoreHTTPSErrors: true });
  phone = await context.newPage();
  await phone.goto(bosco.phoneUrl);
});

When('le téléphone saisit le code', async () => {
  await phone?.getByLabel('Code à 6 chiffres').fill(code);
  await phone?.getByRole('button', { name: 'Appairer' }).click();
});

Then('le téléphone voit le titre {texte}', async ({}, name: string) => {
  if (!phone) throw new Error('No phone opened');
  await expect(phone.getByRole('heading', { name })).toBeVisible();
});

Then('le téléphone voit la page {texte}', async ({}, path: string) => {
  if (!phone) throw new Error('No phone opened');
  await expect(phone).toHaveURL((url) => url.pathname === path);
  await phone.context().close();
  phone = null;
});
