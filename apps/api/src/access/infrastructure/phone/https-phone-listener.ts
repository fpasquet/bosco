// Écoute HTTPS du téléphone sur le réseau local (DT-10, NF-13) : ouverte seulement quand l'accès est activé, elle
// passe chaque requête au même serveur que le poste, après le contrôle du jeton de l'appareil (NF-14).
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Duplex } from 'node:stream';
import { createServer, type Server } from 'node:https';
import { networkInterfaces } from 'node:os';
import type { PhoneListener } from '../../application/ports.ts';
import { certificateFor } from './certificate.ts';

export const DEVICE_COOKIE = 'bosco_device';

/** Ce que le téléphone peut ouvrir sans être appairé : la page d'appairage et ce qu'elle charge. */
const OPEN_PATHS = [/^\/pair(\/|$|\?)/, /^\/_next\//, /^\/api\/pairing\/claim$/, /^\/favicon/];

/** Réservé au poste, même pour un téléphone appairé : les hooks, l'accès, les tests, et tout réglage (E4b mobile). */
const WORKSTATION_ONLY = [/^\/api\/hooks\//, /^\/api\/phone-access/, /^\/api\/devices/, /^\/__test\//];
const SETTINGS = [
  /^\/api\/sources/,
  /^\/api\/settings/,
  /^\/api\/isolation/,
  /^\/api\/rights/,
  /^\/api\/repositories\/[^/]+\/test-environment/,
  /^\/api\/context/,
  /^\/api\/socles/,
  // Sur le téléphone, une décision proposée s'accepte ou se refuse ; le reste s'écrit sur le poste (E9b mobile)
  /^\/api\/decisions(\/\d+\/(versions|abandon))?$/,
  /^\/api\/integrations/,
  // Un lien s'ajoute depuis le téléphone ; il se retire sur le poste (E10b mobile)
  /^\/api\/tasks\/\d+\/links\/\d+$/,
];

function workstationOnly(request: IncomingMessage, path: string): boolean {
  if (WORKSTATION_ONLY.some((pattern) => pattern.test(path))) return true;
  return request.method !== 'GET' && SETTINGS.some((pattern) => pattern.test(path));
}

export interface PhoneListenerOptions {
  authorize: (token: null | string) => Promise<boolean>;
  dataDir: string;
  /** Adresse imposée (tests) ; sinon les adresses IPv4 du poste sur le réseau local */
  host: null | string;
  /** Requête passée au serveur du poste (Fastify) */
  handle: (request: IncomingMessage, response: ServerResponse) => void;
  /** Connexion WebSocket passée au serveur du poste ; seules celles de l'interface (/_next/) sont admises */
  upgrade?: (request: IncomingMessage, socket: Duplex, head: Buffer) => void;
  port: number;
}

export function lanAddresses(): string[] {
  return Object.values(networkInterfaces())
    .flatMap((entries) => entries ?? [])
    .filter((entry) => entry.family === 'IPv4' && !entry.internal)
    .map((entry) => entry.address);
}

export function tokenOf(request: IncomingMessage): null | string {
  const cookies = request.headers.cookie?.split(';') ?? [];
  const cookie = cookies.map((part) => part.trim()).find((part) => part.startsWith(`${DEVICE_COOKIE}=`));
  return cookie ? decodeURIComponent(cookie.slice(DEVICE_COOKIE.length + 1)) : null;
}

export class HttpsPhoneListener implements PhoneListener {
  private server: null | Server = null;
  private hosts: string[] = [];

  constructor(private readonly options: PhoneListenerOptions) {}

  urls(): string[] {
    return this.server ? this.hosts.map((host) => `https://${host}:${this.options.port}`) : [];
  }

  async start(): Promise<{ urls: string[] }> {
    if (this.server) return { urls: this.urls() };
    this.hosts = this.options.host ? [this.options.host] : lanAddresses();
    const host = this.hosts[0];
    if (!host) throw new Error('No local network address: the phone cannot reach this workstation');
    const certificate = await certificateFor(this.options.dataDir, this.hosts);
    const server = createServer(certificate, (request, response) => void this.gate(request, response));
    server.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
      const upgrade = this.options.upgrade;
      if (upgrade && request.url?.startsWith('/_next/')) upgrade(request, socket, head);
      else socket.destroy();
    });
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(this.options.port, host, resolve);
    });
    this.server = server;
    return { urls: this.urls() };
  }

  async stop(): Promise<void> {
    const server = this.server;
    this.server = null;
    if (!server) return;
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  private async gate(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const path = request.url ?? '/';
    if (workstationOnly(request, path)) return this.refuse(response, 403);
    if (OPEN_PATHS.some((pattern) => pattern.test(path)) || (await this.options.authorize(tokenOf(request))))
      return this.options.handle(request, response);
    // Un téléphone non appairé n'accède à rien : les pages mènent à l'appairage, l'API répond 401 (NF-14)
    if (path.startsWith('/api/')) return this.refuse(response, 401);
    response.writeHead(302, { location: '/pair' }).end();
  }

  private refuse(response: ServerResponse, status: number): void {
    response.writeHead(status, { 'content-type': 'application/json' }).end(JSON.stringify({ statusCode: status }));
  }
}
