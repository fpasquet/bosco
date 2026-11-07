import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { APP_NAME } from '@bosco/core/shared';
import { hostWeb } from './adapters/in/web/next-host.ts';
import { AppModule } from './app.module.ts';
import { loadConfig } from './config.ts';

const config = loadConfig();
const app = await NestFactory.create<NestFastifyApplication>(AppModule.forRoot(config), new FastifyAdapter(), {
  logger: ['error', 'warn'],
});
app.enableShutdownHooks();
if (config.webDir) await hostWeb(app, config.webDir);
await app.listen(config.port, config.host);
const url = await app.getUrl();
console.log(`${APP_NAME.toLowerCase()} listening on ${url}`);
