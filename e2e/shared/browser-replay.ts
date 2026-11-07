import type { Page } from '@playwright/test';
// Rejeu des réponses de l'API de Bosco dans le navigateur, pour les écrans sans temps réel. Même format de fichier
// que le module côté serveur ; seul le chemin compte, pas le port de l'instance de test.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const slug = (method: string, path: string) =>
  `${method.toLowerCase()}${path.replace(/[^a-z0-9]+/gi, '-')}`.replace(/-$/, '');

export async function replayApi(
  page: Page,
  dir: string,
  pattern: string,
  mode: string,
  used: Set<string>,
): Promise<void> {
  await page.route(pattern, async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname + url.search;
    const file = join('bosco-api', `${slug(route.request().method(), path)}.1.json`);
    if (mode === 'record' || mode === 'update') {
      const response = await route.fetch();
      const text = await response.text();
      mkdirSync(dirname(join(dir, file)), { recursive: true });
      const recording = {
        origin: 'bosco',
        method: route.request().method(),
        path,
        status: response.status(),
        headers: { 'content-type': response.headers()['content-type'] ?? 'application/json' },
        body: JSON.parse(text) as unknown,
      };
      writeFileSync(join(dir, file), `${JSON.stringify(recording, null, 2)}\n`);
      used.add(file);
      await route.fulfill({ response, body: text });
      return;
    }
    let recording: { status: number; headers: Record<string, string>; body: unknown };
    try {
      recording = JSON.parse(readFileSync(join(dir, file), 'utf8')) as typeof recording;
    } catch {
      await route.abort('failed');
      throw new Error(`No recording for ${route.request().method()} ${path} (run with BOSCO_REPLAY=record)`);
    }
    used.add(file);
    await route.fulfill({ status: recording.status, headers: recording.headers, body: JSON.stringify(recording.body) });
  });
}
