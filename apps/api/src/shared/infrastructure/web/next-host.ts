import type { NestFastifyApplication } from '@nestjs/platform-fastify';
// Next.js servi par NestJS sur le même port (DT-13) : toute requête qui n'est pas une route de l'API va à l'interface.
import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import nextModule from 'next';

export async function hostWeb(app: NestFastifyApplication, dir: string, dev: boolean): Promise<void> {
  // next est un module CommonJS : son export par défaut n'est pas vu comme appelable sous NodeNext
  const createNext = ((nextModule as { default?: unknown }).default ?? nextModule) as typeof nextModule.default;
  const web = createNext({ dev, dir });
  await web.prepare();
  const handle = web.getRequestHandler();
  app
    .getHttpAdapter()
    .getInstance()
    .all('/*', async (request, reply) => {
      reply.hijack();
      await handle(request.raw, reply.raw);
    });
  // Rechargement à chaud : Next.js en mode développement ouvre une connexion WebSocket sur le même port
  const upgraded = new Set<Duplex>();
  if (dev) {
    const upgrade = web.getUpgradeHandler();
    app.getHttpServer().on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
      upgraded.add(socket);
      socket.once('close', () => upgraded.delete(socket));
      void upgrade(request, socket, head);
    });
  }
  // À l'arrêt, les WebSocket ne sont plus suivies par le serveur HTTP et Next.js garde ses observateurs de fichiers :
  // sans les fermer, un redémarrage attend sans fin
  app
    .getHttpAdapter()
    .getInstance()
    .addHook('preClose', async () => {
      for (const socket of upgraded) socket.destroy();
      await web.close();
    });
}
