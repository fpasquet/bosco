// Ce que les scénarios ne voient pas : le proxy laisse passer un domaine de la liste, refuse et note les autres,
// et relit la liste à chaque connexion (RF-CONT-07). Lancé en local, sans Docker, contre un serveur de test.
import { type ChildProcess, spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer, request, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const PORT = 39_128;
const dir = mkdtempSync(join(tmpdir(), 'bosco-egress-'));
const allow = join(dir, 'allow.json');
const refusals = join(dir, 'refusals.jsonl');
let proxy: ChildProcess;
let target: Server;
let targetPort = 0;

/** GET http://hôte:port/ par le proxy : le statut de la réponse. */
function viaProxy(host: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const outgoing = request(
      { host: '127.0.0.1', port: PORT, path: `http://${host}:${targetPort}/`, headers: { host } },
      (response) => {
        response.resume();
        resolve(response.statusCode ?? 0);
      },
    );
    outgoing.on('error', reject);
    outgoing.end();
  });
}

/** Tunnel CONNECT : le statut de la réponse du proxy. */
function tunnel(host: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const outgoing = request({ host: '127.0.0.1', port: PORT, method: 'CONNECT', path: `${host}:${targetPort}` });
    outgoing.on('connect', (response, socket) => {
      socket.destroy();
      resolve(response.statusCode ?? 0);
    });
    outgoing.on('error', reject);
    outgoing.end();
  });
}

beforeAll(async () => {
  target = createServer((_, answer) => answer.end('ok'));
  await new Promise<void>((resolve) => target.listen(0, '127.0.0.1', resolve));
  const address = target.address();
  targetPort = typeof address === 'object' && address ? address.port : 0;
  writeFileSync(allow, JSON.stringify(['127.0.0.1']));
  proxy = spawn(process.execPath, [join(import.meta.dirname, 'egress-proxy.ts')], {
    env: {
      ...process.env,
      BOSCO_EGRESS_ALLOW: allow,
      BOSCO_EGRESS_REFUSALS: refusals,
      BOSCO_EGRESS_PORT: String(PORT),
    },
    stdio: 'ignore',
  });
  for (let attempt = 0; attempt < 50; attempt++) {
    const up = await tunnel('127.0.0.1').then(
      () => true,
      () => false,
    );
    if (up) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
});

afterAll(() => {
  proxy.kill();
  target.close();
});

describe('egress proxy', () => {
  it('lets a listed domain through, over HTTP and through a tunnel', async () => {
    const plain = await viaProxy('127.0.0.1');
    const tunnelled = await tunnel('127.0.0.1');
    expect([plain, tunnelled]).toEqual([200, 200]);
  });

  it('refuses any other domain and notes the refusal', async () => {
    const tunnelled = await tunnel('localhost');
    const plain = await viaProxy('localhost');
    expect([tunnelled, plain]).toEqual([403, 403]);
    const hosts = readFileSync(refusals, 'utf8')
      .trim()
      .split('\n')
      .map((line) => (JSON.parse(line) as { host: string }).host);
    expect(hosts).toEqual(['localhost', 'localhost']);
  });

  it('reads the list again on each connection', async () => {
    writeFileSync(allow, JSON.stringify(['127.0.0.1', 'localhost']));
    const status = await tunnel('localhost');
    expect(status).toBe(200);
  });
});
