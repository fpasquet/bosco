// Ce que les scénarios ne voient pas : l'écoute limitée à l'adresse du réseau local, et, sous make dev, la connexion
// WebSocket de Next.js passée au serveur du poste pour /_next/ seulement, toute autre connexion étant fermée.
import { mkdtempSync } from 'node:fs';
import { request } from 'node:https';
import { connect } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { certificateFor } from './certificate.ts';
import { HttpsPhoneListener } from './https-phone-listener.ts';

const PORT = 39_481;
const dataDir = mkdtempSync(join(tmpdir(), 'bosco-phone-'));
const relayed: string[] = [];
/** Le certificat créé par Bosco, que le téléphone a accepté : le test le prend pour autorité */
let authority: Buffer | null = null;
const listener = new HttpsPhoneListener({
  authorize: () => Promise.resolve(false),
  dataDir,
  handle: (_, response) => response.end(),
  host: '127.0.0.1',
  port: PORT,
  upgrade: (incoming, socket) => {
    relayed.push(incoming.url ?? '');
    socket.end('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n\r\n');
  },
});

/** Demande une connexion WebSocket : le statut de la réponse, ou « closed » si la connexion est fermée. */
function upgrade(path: string): Promise<number | string> {
  return new Promise((resolve) => {
    const outgoing = request({
      headers: { connection: 'Upgrade', upgrade: 'websocket', 'sec-websocket-version': '13', 'sec-websocket-key': 'x' },
      host: '127.0.0.1',
      path,
      port: PORT,
      ca: authority ?? undefined,
    });
    outgoing.on('upgrade', (response, socket) => {
      socket.destroy();
      resolve(response.statusCode ?? 0);
    });
    outgoing.on('error', () => resolve('closed'));
    outgoing.end();
  });
}

beforeAll(async () => {
  await listener.start();
  const certificate = await certificateFor(dataDir, ['127.0.0.1']);
  authority = certificate.cert;
});

afterAll(async () => {
  await listener.stop();
});

/** Une connexion TCP à cette adresse : ouverte, ou refusée. */
function reach(host: string): Promise<'open' | 'refused'> {
  return new Promise((resolve) => {
    const socket = connect({ host, port: PORT }, () => {
      socket.destroy();
      resolve('open');
    });
    socket.on('error', () => resolve('refused'));
  });
}

describe('HttpsPhoneListener address', () => {
  it('CA-SESS-70 · listens on the address of the local network only, never on every interface', async () => {
    expect(listener.urls()).toEqual([`https://127.0.0.1:${PORT}`]);
    // 127.0.0.2 mène au même poste : une écoute sur toutes les interfaces y répondrait
    const [local, other] = await Promise.all([reach('127.0.0.1'), reach('127.0.0.2')]);
    expect([local, other]).toEqual(['open', 'refused']);
  });
});

describe('HttpsPhoneListener upgrades', () => {
  it('passes the Next.js WebSocket to the workstation server', async () => {
    const status = await upgrade('/_next/hmr?id=1');
    expect(status).toBe(101);
    expect(relayed).toEqual(['/_next/hmr?id=1']);
  });

  it('closes any other WebSocket', async () => {
    const status = await upgrade('/api/events');
    expect(status).toBe('closed');
    expect(relayed).toEqual(['/_next/hmr?id=1']);
  });
});
