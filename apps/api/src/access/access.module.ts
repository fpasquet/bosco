import type { MikroORM } from '@mikro-orm/sqlite';
import type { Server as HttpServer, IncomingMessage, ServerResponse } from 'node:http';
import { Inject, Module, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { Config } from '../config.ts';
import { CONFIG, ORM } from '../shared/tokens.ts';
import { AccessService } from './application/access.service.ts';
import { MikroOrmAccessSettings, MikroOrmDeviceRepository } from './infrastructure/persistence/device.repository.ts';
import { HttpsPhoneListener } from './infrastructure/phone/https-phone-listener.ts';
import { cryptoSecrets } from './infrastructure/phone/secrets.ts';
import { AccessController } from './interface/http/access.controller.ts';
import { ACCESS_SERVICE, PHONE_LISTENER } from './tokens.ts';

interface Routing {
  routing: (request: IncomingMessage, response: ServerResponse) => void;
}

/** Contexte de l'accès depuis le téléphone (E4c) : écoute du réseau local, appairage, téléphones appairés. */
@Module({
  controllers: [AccessController],
  providers: [
    {
      provide: PHONE_LISTENER,
      inject: [CONFIG, HttpAdapterHost, ORM],
      useFactory: (config: Config, adapter: HttpAdapterHost, orm: MikroORM) => {
        const devices = new MikroOrmDeviceRepository(orm);
        return new HttpsPhoneListener({
          dataDir: config.dataDir,
          host: config.phone.host,
          port: config.phone.port,
          // La même application que sur le poste : Fastify route la requête, API et interface comprises
          handle: (request, response) => adapter.httpAdapter.getInstance<Routing>().routing(request, response),
          // Connexions WebSocket (rechargement à chaud de Next.js sous make dev) : passées au serveur du poste, qui
          // les traite déjà ; sans elles, la page du téléphone ne s'anime pas en développement
          upgrade: (request, socket, head) => {
            const server = adapter.httpAdapter.getHttpServer() as HttpServer;
            server.emit('upgrade', request, socket, head);
          },
          authorize: async (token) =>
            token !== null && (await devices.findByTokenHash(cryptoSecrets.hash(token))) !== null,
        });
      },
    },
    {
      provide: ACCESS_SERVICE,
      inject: [ORM, PHONE_LISTENER],
      useFactory: (orm: MikroORM, listener: HttpsPhoneListener) =>
        new AccessService(new MikroOrmDeviceRepository(orm), listener, new MikroOrmAccessSettings(orm), cryptoSecrets, {
          now: () => new Date(),
        }),
    },
  ],
  exports: [ACCESS_SERVICE],
})
export class AccessModule implements OnApplicationBootstrap, OnApplicationShutdown {
  constructor(
    @Inject(ACCESS_SERVICE) private readonly access: AccessService,
    @Inject(PHONE_LISTENER) private readonly listener: HttpsPhoneListener,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.access.resume();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.listener.stop();
  }
}
