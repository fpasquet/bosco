import type { MikroORM } from '@mikro-orm/sqlite';
import { Module } from '@nestjs/common';
import type { SessionService } from '../sessions/application/session.service.ts';
import { SessionsModule } from '../sessions/sessions.module.ts';
import { SESSION_SERVICE } from '../sessions/tokens.ts';
import { ORM } from '../shared/tokens.ts';
import { ContextService } from './application/context.service.ts';
import {
  MikroOrmArchitectureStore,
  MikroOrmDecisionRepository,
  MikroOrmSocleRepository,
} from './infrastructure/persistence/context.repositories.ts';
import { ContextController } from './interface/http/context.controller.ts';
import { McpController } from './interface/mcp/mcp.controller.ts';
import { CONTEXT_SERVICE } from './tokens.ts';

const clock = { now: () => new Date() };

/**
 * Contexte des agents (RF-CONT-01 à 03, 10, 11) : décisions, socles et architecture, lus par les sessions par le
 * serveur MCP de Bosco ; les projets sont ceux que la personne a ajoutés.
 */
@Module({
  imports: [SessionsModule],
  controllers: [ContextController, McpController],
  providers: [
    {
      provide: CONTEXT_SERVICE,
      inject: [ORM, SESSION_SERVICE],
      useFactory: (orm: MikroORM, sessions: SessionService) =>
        new ContextService(
          new MikroOrmDecisionRepository(orm),
          new MikroOrmSocleRepository(orm),
          new MikroOrmArchitectureStore(orm),
          { list: () => sessions.knownProjects() },
          clock,
        ),
    },
  ],
  exports: [CONTEXT_SERVICE],
})
export class ContextModule {}
