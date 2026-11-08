// Phrases des tâches : des tâches préparées par l'API avant d'ouvrir l'écran.
import { expect } from '@playwright/test';
import { Given, When } from './fixtures.ts';

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
