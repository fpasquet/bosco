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
import { CONTEXT_SERVICE } from './tokens.ts';

/** Contexte des agents (RF-CONT-01 à 03, 10, 11) : décisions, socles, architecture ; les dépôts viennent des sessions. */
@Module({
  imports: [SessionsModule],
  controllers: [ContextController],
  providers: [
    {
      provide: CONTEXT_SERVICE,
      inject: [ORM, SESSION_SERVICE],
      useFactory: (orm: MikroORM, sessions: SessionService) =>
        new ContextService(
          new MikroOrmDecisionRepository(orm),
          new MikroOrmSocleRepository(orm),
          new MikroOrmArchitectureStore(orm),
          { list: () => sessions.knownRepositories() },
          { now: () => new Date() },
        ),
    },
  ],
  exports: [CONTEXT_SERVICE],
})
export class ContextModule {}
