import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { APP_NAME } from '@bosco/domain';
import { AppModule } from './app.module.ts';
import { loadConfig } from './config.ts';
import { hostWeb } from './shared/infrastructure/web/next-host.ts';

/** Un message à une session pilotée peut joindre 5 images de 5 Mo, en base64 (E2e) */
const BODY_LIMIT = 40 * 1024 * 1024;

const config = loadConfig();
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule.forRoot(config),
  new FastifyAdapter({ forceCloseConnections: true, bodyLimit: BODY_LIMIT }),
  {
    logger: ['error', 'warn'],
  },
);
app.enableShutdownHooks();
if (config.webDir) await hostWeb(app, config.webDir, config.dev);
await app.listen(config.port, config.host);
const url = await app.getUrl();
console.log(`${APP_NAME.toLowerCase()} listening on ${url}`);
