import type { DataTable } from 'playwright-bdd';
import { expect, type Page } from '@playwright/test';
// Phrases de la vue d'ensemble : horloge du navigateur, sessions qui vivent pendant le scénario, tableau et colonnes.
import { appendFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Given, Then, When } from './fixtures.ts';

const TIMESTAMP = /"timestamp":\s*"([^"]+)"/g;

function transcriptOf(transcripts: Map<string, string>, sessionId: string): string {
  const file = transcripts.get(sessionId);
  if (!file) throw new Error(`No transcript was written for the session ${sessionId}`);
  return file;
}

Given('il est {texte} dans le navigateur', async ({ page }, time: string) => {
  await page.clock.setFixedTime(new Date(time));
});

// Les transcripts d'exemple sont datés : on les décale pour que leur dernier événement date de `ago` millisecondes.
function lastActedAgo(file: string, ago: number): void {
  const content = readFileSync(file, 'utf8');
  const last = Math.max(...[...content.matchAll(TIMESTAMP)].map(([, time]) => Date.parse(time ?? '')));
  const shift = Date.now() - ago - last;
  writeFileSync(
    file,
    content.replaceAll(
      TIMESTAMP,
      (_, time: string) => `"timestamp": "${new Date(Date.parse(time) + shift).toISOString()}"`,
    ),
  );
}

Given('la session {texte} a agi il y a quelques secondes', ({ transcripts }, sessionId: string) => {
  lastActedAgo(transcriptOf(transcripts, sessionId), 5000);
});

Given('la session {texte} est inactive depuis {int} minutes', ({ transcripts }, sessionId: string, minutes: number) => {
  lastActedAgo(transcriptOf(transcripts, sessionId), minutes * 60_000);
});

/** Fichier du registre des sessions ouvertes que Claude Code tient dans le profil : <profil>/sessions/<pid>.json */
function registryEntryOf(transcripts: Map<string, string>, sessionId: string): string {
  const profile = dirname(dirname(dirname(transcriptOf(transcripts, sessionId))));
  return join(profile, 'sessions', `${process.pid}.json`);
}

// Le processus des scénarios tient lieu de processus de Claude Code : il est vivant tant que le scénario tourne.
Given('la session {texte} est ouverte dans Claude Code', ({ transcripts }, sessionId: string) => {
  const entry = registryEntryOf(transcripts, sessionId);
  mkdirSync(dirname(entry), { recursive: true });
  writeFileSync(entry, JSON.stringify({ pid: process.pid, sessionId, status: 'busy', kind: 'interactive' }));
});

When('la session {texte} est arrêtée dans Claude Code', ({ transcripts }, sessionId: string) => {
  rmSync(registryEntryOf(transcripts, sessionId));
});

When('la session {texte} lance la commande {texte}', ({ transcripts }, sessionId: string, command: string) => {
  const file = transcriptOf(transcripts, sessionId);
  const cwd = /"cwd":\s*"([^"]+)"/.exec(readFileSync(file, 'utf8'))?.[1];
  const line = {
    sessionId,
    cwd,
    type: 'assistant',
    isSidechain: false,
    uuid: `scenario-${Date.now()}`,
    timestamp: new Date().toISOString(),
    message: {
      id: `msg_scenario_${Date.now()}`,
      model: 'claude-sonnet-5-5',
      role: 'assistant',
      content: [{ type: 'tool_use', id: 'toolu_scenario', name: 'Bash', input: { command } }],
      usage: { input_tokens: 10, output_tokens: 10, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
    },
  };
  appendFileSync(file, `${JSON.stringify(line)}\n`);
});

/** Lignes du tableau des sessions : intertitre de dépôt, titre et état, dans l'ordre de l'écran. */
async function overviewRows(page: Page): Promise<Record<string, string>[]> {
  const rows: Record<string, string>[] = [];
  for (const group of await page.getByRole('table', { name: 'Sessions ouvertes' }).locator('tbody').all()) {
    const [repository = ''] = await group.locator('th[scope=colgroup] b').allTextContents();
    for (const row of await group.locator('tr:has(td)').all()) {
      const cells = row.locator('td');
      const [title = ''] = await cells.nth(1).locator('.truncate').allTextContents();
      rows.push({ dépôt: repository, session: title, état: (await cells.nth(0).textContent()) ?? '' });
    }
  }
  return rows;
}

Then('la vue d’ensemble montre, dans l’ordre :', async ({ page }, table: DataTable) => {
  await expect.poll(() => overviewRows(page)).toEqual(table.hashes());
});

const titles = async (page: Page) => (await overviewRows(page)).map((row) => row.session);

Then('la vue d’ensemble montre la session {texte}', async ({ page }, title: string) => {
  await expect.poll(() => titles(page)).toContain(title);
});

Then('la vue d’ensemble ne montre plus la session {texte}', async ({ page }, title: string) => {
  await expect.poll(() => titles(page)).not.toContain(title);
});

Then('l’indicateur {texte} vaut {texte}', async ({ page }, label: string, value: string) => {
  const tile = page.locator('dl > div').filter({ has: page.getByRole('term').getByText(label, { exact: true }) });
  await expect(tile.getByRole('definition')).toContainText(value);
});

Then('le tableau a la colonne {texte}', async ({ page }, name: string) => {
  await expect(page.getByRole('columnheader', { name })).toBeVisible();
});

Then('la colonne {texte} montre la session {texte}', async ({ page }, column: string, title: string) => {
  await expect(page.getByRole('region', { name: column }).getByRole('heading', { name: title })).toBeVisible();
});

Then('la carte de la session {texte} montre les actions :', async ({ page }, title: string, table: DataTable) => {
  const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: title }) });
  const actions = card.getByRole('list', { name: 'Dernières actions' }).getByRole('listitem');
  await expect
    .poll(async () => (await actions.allTextContents()).map((text) => text.replace(/^▸\s*/, '')))
    .toEqual(table.raw().map(([action]) => action));
});
