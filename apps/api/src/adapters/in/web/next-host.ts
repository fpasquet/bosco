// Next.js servi par NestJS sur le même port (DT-13) : toute requête qui n'est pas une route de l'API va à l'interface.
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import nextModule from 'next';

export async function hostWeb(app: NestFastifyApplication, dir: string): Promise<void> {
  // next est un module CommonJS : son export par défaut n'est pas vu comme appelable sous NodeNext
  const createNext = ((nextModule as { default?: unknown }).default ?? nextModule) as typeof nextModule.default;
  const web = createNext({ dev: false, dir });
  await web.prepare();
  const handle = web.getRequestHandler();
  app
    .getHttpAdapter()
    .getInstance()
    .all('/*', async (request, reply) => {
      reply.hijack();
      await handle(request.raw, reply.raw);
    });
}
