// Phrases du serveur MCP : une session Claude Code appelle les outils de Bosco, comme le ferait Claude Code.
import { expect } from '@playwright/test';
import { join } from 'node:path';
import { Then, When } from './fixtures.ts';

let answer: { isError: boolean; text: string; status: number } = { isError: false, text: '', status: 0 };

async function call(url: string, secret: null | string, name: string, args: Record<string, unknown>) {
  const response = await fetch(`${url}/mcp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(secret ? { authorization: `Bearer ${secret}` } : {}) },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }),
  });
  if (!response.ok) return { isError: true, text: '', status: response.status };
  const body = (await response.json()) as { result: { content: { text: string }[]; isError: boolean } };
  return { isError: body.result.isError, text: body.result.content[0]?.text ?? '', status: response.status };
}

When(
  'a Claude Code session in {string} calls the Bosco tool {string}',
  async ({ bosco }, folder: string, name: string) => {
    answer = await call(bosco.url, bosco.secret(), name, { path: join(bosco.profilesRoot, folder) });
  },
);

When(
  'the session calls the Bosco tool {string} with:',
  async ({ bosco }, name: string, table: { rowsHash(): Record<string, string> }) => {
    const args: Record<string, unknown> = Object.fromEntries(
      Object.entries(table.rowsHash()).map(([key, value]): [string, unknown] => {
        // Un dossier se donne depuis le dossier du scénario, comme le cwd absolu d'une session
        if (key === 'path') return [key, join(bosco.profilesRoot, value)];
        // Les dossiers ajoutés à la session, séparés par des virgules
        if (key === 'paths') return [key, value.split(',').map((path) => join(bosco.profilesRoot, path.trim()))];
        return [key, /^\d+$/.test(value) ? Number(value) : value];
      }),
    );
    answer = await call(bosco.url, bosco.secret(), name, args);
  },
);

When(
  'a Claude Code session in {string} proposes the decision {string}',
  async ({ bosco }, folder: string, title: string) => {
    answer = await call(bosco.url, bosco.secret(), 'bosco_propose_decision', {
      path: join(bosco.profilesRoot, folder),
      title,
      context: 'Les sigles arrivent avec ou sans points.',
      decision: 'Retirer les points avant la recherche.',
    });
  },
);

When('a program without the secret calls the Bosco tool {string}', async ({ bosco }, name: string) => {
  answer = await call(bosco.url, null, name, {});
});

Then('the Bosco tool answers {string}', ({}, text: string) => {
  expect(answer.text).toContain(text);
});

Then('the Bosco tool is refused with the code {int}', ({}, status: number) => {
  expect(answer.status).toBe(status);
});
