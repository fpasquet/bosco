// Phrases du contexte des agents : une décision proposée par une session, comme le ferait Claude Code par MCP.
import { expect } from '@playwright/test';
import { join } from 'node:path';
import { Given } from './fixtures.ts';

Given(
  'une session a proposé la décision {texte} dans le projet {texte}',
  async ({ bosco }, title: string, project: string) => {
    const response = await fetch(`${bosco.url}/mcp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${bosco.secret()}` },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'bosco_propose_decision',
          arguments: {
            path: join(bosco.profilesRoot, project),
            title,
            context: 'Les sigles arrivent avec ou sans points.',
            decision: 'Retirer les points avant la recherche.',
          },
        },
      }),
    });
    expect(response.status).toBe(200);
  },
);

Given('le projet {texte} a la décision acceptée {texte}', async ({ bosco }, project: string, title: string) => {
  const response = await fetch(`${bosco.url}/api/decisions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      target: { kind: 'project', name: project },
      text: { title, context: 'Un contexte.', decision: `${title}.` },
      accept: true,
    }),
  });
  expect(response.status).toBe(201);
});
