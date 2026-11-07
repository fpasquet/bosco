import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { cleanUnused, findSecrets, installReplay } from './replay.ts';

// « Vrai » service : un serveur local qui compte les appels et renvoie le jeton reçu
let server: Server;
let calls = 0;
const origin = 'http://127.0.0.1:4571';
beforeAll(async () => {
  server = createServer((request, response) => {
    let body = '';
    request.on('data', (chunk: Buffer) => (body += chunk.toString()));
    request.on('end', () => {
      response.setHeader('content-type', 'application/json');
      response.setHeader('x-ratelimit-remaining', '42');
      response.end(
        JSON.stringify({
          path: request.url,
          call: ++calls,
          echo: body ? (JSON.parse(body) as unknown) : null,
          token: request.headers.authorization,
        }),
      );
    });
  });
  await new Promise<void>((resolve) => server.listen(4571, resolve));
});
afterAll(() => server.close());

const get = async (path: string) =>
  (await fetch(origin + path, { headers: { authorization: 'Bearer ghp_abcdefghijkl' } })).json();
const post = async (path: string, body: object) =>
  (
    await fetch(origin + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  ).json();

describe('replay', () => {
  const dir = mkdtempSync(join(tmpdir(), 'replay-'));
  const host = '127.0.0.1:4571';

  test('record : enregistre les réponses, lisibles et anonymisées', async () => {
    const replay = installReplay({ mode: 'record', dir });
    expect(await get('/pulls/1')).toMatchObject({ call: 1 });
    expect(await get('/pulls/1')).toMatchObject({ call: 2 });
    await post('/search', { jql: 'project = VIG' });
    await post('/search', { jql: 'project = OPS' });
    expect(replay.used()).toHaveLength(4);
    expect(readdirSync(join(dir, host))).toHaveLength(4);
    const first = JSON.parse(readFileSync(join(dir, host, 'get-pulls-1.1.json'), 'utf8')) as unknown;
    expect(first).toEqual({
      origin,
      method: 'GET',
      path: '/pulls/1',
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: expect.objectContaining({ token: 'Bearer ***' }) as unknown,
    });
    expect(findSecrets(dir)).toEqual([]);
  });

  test("replay : service coupé, réponses dans l'ordre puis la dernière indéfiniment", async () => {
    const before = calls;
    const replay = installReplay({ mode: 'replay', dir });
    expect(await get('/pulls/1')).toMatchObject({ call: 1 });
    expect(await get('/pulls/1')).toMatchObject({ call: 2 });
    expect(await get('/pulls/1')).toMatchObject({ call: 2 });
    replay.reset();
    expect(await get('/pulls/1')).toMatchObject({ call: 1 });
    expect(calls).toBe(before);
  });

  test('replay : le corps de la requête choisit la réponse', async () => {
    installReplay({ mode: 'replay', dir });
    expect(await post('/search', { jql: 'project = OPS' })).toMatchObject({ echo: { jql: 'project = OPS' } });
    expect(await post('/search', { jql: 'project = VIG' })).toMatchObject({ echo: { jql: 'project = VIG' } });
  });

  test('replay : une requête inconnue échoue, rien ne sort', async () => {
    installReplay({ mode: 'replay', dir });
    await expect(get('/pulls/99')).rejects.toThrow();
    await expect(post('/search', { jql: 'autre' })).rejects.toThrow();
  });

  test("record : rejoue l'existant et n'enregistre que ce qui manque", async () => {
    const before = calls;
    const replay = installReplay({ mode: 'record', dir });
    expect(await get('/pulls/1')).toMatchObject({ call: 1 });
    await get('/pulls/2');
    expect(calls).toBe(before + 1);
    expect(replay.used()).toEqual(['127.0.0.1:4571/get-pulls-1.1.json', '127.0.0.1:4571/get-pulls-2.1.json']);
  });

  test("clean : supprime ce qu'aucun processus n'a utilisé", async () => {
    const first = installReplay({ mode: 'clean', dir });
    await get('/pulls/1');
    const usedByFirst = first.used();
    const second = installReplay({ mode: 'clean', dir });
    await post('/search', { jql: 'project = VIG' });
    const removed = cleanUnused(dir, [...usedByFirst, ...second.used()]);
    expect(removed).toHaveLength(3);
    expect(removed).toEqual(
      expect.arrayContaining([
        '127.0.0.1:4571/get-pulls-1.2.json',
        '127.0.0.1:4571/get-pulls-2.1.json',
        expect.stringMatching(/^127\.0\.0\.1:4571\/post-search-\w+\.1\.json$/),
      ]),
    );
    expect(readdirSync(join(dir, host))).toHaveLength(2);
  });
});
