// Phrases du canal de Bosco (E2i, E4f) : le scénario tient le rôle du serveur du canal qu'aurait lancé Claude Code.
import { expect } from '@playwright/test';
import { Given, Then } from './fixtures.ts';

/** Messages reçus par le canal ouvert par le scénario */
const received: string[] = [];
let stream: AbortController | null = null;

Given('la session {texte} a son canal de Bosco ouvert', async ({ bosco }, sessionId: string) => {
  received.splice(0);
  stream?.abort();
  stream = new AbortController();
  const response = await fetch(`${bosco.url}/api/channel/stream?session=${sessionId}`, {
    headers: { authorization: `Bearer ${bosco.secret()}` },
    signal: stream.signal,
  });
  expect(response.status).toBe(200);
  const decoder = new TextDecoder();
  void (async () => {
    try {
      for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>)
        for (const match of decoder.decode(chunk).matchAll(/data: (.+)/g))
          received.push((JSON.parse(match[1] ?? '{}') as { text: string }).text);
    } catch {
      // flux fermé par le scénario
    }
  })();
});

Then('le canal de Bosco reçoit {texte}', async ({}, text: string) => {
  await expect.poll(() => received.join('|')).toContain(text);
  stream?.abort();
});
