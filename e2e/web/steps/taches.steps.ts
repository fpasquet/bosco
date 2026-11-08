// Phrases des tâches : des tâches préparées par l'API avant d'ouvrir l'écran.
import { expect } from '@playwright/test';
import { Given, Then, When } from './fixtures.ts';

Given(
  'une tâche du worker {texte} existe dans le dépôt {texte}',
  async ({ bosco }, instruction: string, repository: string) => {
    const response = await fetch(`${bosco.url}/api/tasks`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ repository, instruction, mode: 'worker', guardrails: { budgetUsd: 1, maxTurns: 20 } }),
    });
    expect(response.status).toBe(201);
  },
);

Given(
  'une tâche du worker {texte} attend la tâche {int} dans le dépôt {texte}',
  async ({ bosco }, instruction: string, prerequisite: number, repository: string) => {
    const response = await fetch(`${bosco.url}/api/tasks`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        repository,
        instruction,
        mode: 'worker',
        prerequisites: [prerequisite],
        guardrails: { budgetUsd: 1, maxTurns: 20 },
      }),
    });
    expect(response.status).toBe(201);
  },
);

When('je clique sur le bouton {texte} de la confirmation', async ({ page }, name: string) => {
  await page.getByRole('alertdialog').getByRole('button', { name }).click();
});

Given('Docker ne répond pas', async ({ bosco }) => {
  const response = await fetch(`${bosco.url}/__test/worker`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ unavailable: 'Docker ne répond pas' }),
  });
  expect(response.status).toBe(204);
});

Given('le proxy de la tâche {int} a refusé {texte}', async ({ bosco }, taskId: number, host: string) => {
  const response = await fetch(`${bosco.url}/__test/refusals`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ taskId, host }),
  });
  expect(response.status).toBe(204);
});

Then('la liste {texte} contient {texte}', async ({ page }, label: string, item: string) => {
  await expect(page.getByRole('list', { name: label }).getByRole('listitem').filter({ hasText: item })).toBeVisible();
});

Then('la liste {texte} ne contient plus {texte}', async ({ page }, label: string, item: string) => {
  await expect(page.getByRole('listitem').filter({ hasText: item })).toHaveCount(0);
  await expect(page.getByRole('list', { name: label })).toBeHidden();
});

Given('la tâche {int} est à relire', async ({ bosco }, id: number) => {
  await expect
    .poll(
      async () => {
        const response = await fetch(`${bosco.url}/api/tasks/${id}`);
        return ((await response.json()) as { state: string }).state;
      },
      { timeout: 10_000 },
    )
    .toBe('to_review');
});

Given('le dépôt {texte} demande une PR à chaque validation', async ({ bosco }, repository: string) => {
  const response = await fetch(`${bosco.url}/api/rights/repositories/${repository}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ pullRequest: 'ask' }),
  });
  expect(response.status).toBe(200);
});

When('je décoche {texte}', async ({ page }, label: string) => {
  await page.getByRole('checkbox', { name: label }).uncheck();
});

Then('la liste {texte} ne contient pas {texte}', async ({ page }, label: string, item: string) => {
  await expect(page.getByRole('list', { name: label }).getByRole('listitem').filter({ hasText: item })).toHaveCount(0);
});

Then('le choix {texte} propose {texte}', async ({ page }, label: string, options: string) => {
  await expect(page.getByRole('combobox', { name: label }).getByRole('option')).toHaveText(options.split(', '));
});
