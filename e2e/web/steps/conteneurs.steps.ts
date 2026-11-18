// Phrases des conteneurs en cours : un bac à sable démarré et un tour piloté en cours, lancés par l'API, puis
// attendus dans la mesure des conteneurs.
import { expect } from '@playwright/test';
import { join } from 'node:path';
import type { Bosco } from '../../shared/bosco.ts';
import { Given, When } from './fixtures.ts';

interface ContainersView {
  piloted: unknown[];
  sandboxes: unknown[];
}

async function containers(bosco: Bosco): Promise<ContainersView> {
  const response = await fetch(`${bosco.url}/api/containers`);
  return (await response.json()) as ContainersView;
}

async function start(bosco: Bosco, text: string, sandbox: boolean): Promise<void> {
  const response = await fetch(`${bosco.url}/api/pilot/sessions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      images: [],
      profile: join(bosco.profilesRoot, '.claude-perso'),
      project: join(bosco.profilesRoot, 'maison'),
      settings: { effort: null, model: null, permissionMode: 'acceptEdits' },
      text,
      ...(sandbox ? { sandbox: { branch: 'bosco/s-typescript-6', startBranch: null } } : {}),
    }),
  });
  if (!response.ok) throw new Error(`POST /api/pilot/sessions answered ${response.status}`);
}

Given('une session tourne dans un bac à sable', async ({ bosco }) => {
  await start(bosco, 'Monte TypeScript en version 6', true);
  await expect.poll(async () => (await containers(bosco)).sandboxes.length).toBe(1);
});

Given('une session pilotée a un long tour en cours sur le poste', async ({ bosco }) => {
  await start(bosco, 'Lance un long travail sur les tarifs', false);
  await expect.poll(async () => (await containers(bosco)).piloted.length).toBe(1);
});

Given('Docker ne répond plus', async ({ bosco }) => {
  await fetch(`${bosco.url}/__test/docker`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ reachable: false }),
  });
});

When('je clique sur le résumé {texte} de la barre latérale', async ({ page }, name: string) => {
  // Le résumé se nomme par son titre, suivi de ce qui tourne (« Conteneurs 1 bac à sable · 1,3 Go »)
  await page.getByRole('button', { name: new RegExp(`^${name}`) }).click();
});
