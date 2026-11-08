import type { MikroORM } from '@mikro-orm/sqlite';
import { Inject, Module, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import type { Config } from '../config.ts';
import type { SessionService } from '../sessions/application/session.service.ts';
import { SessionsModule } from '../sessions/sessions.module.ts';
import { SESSION_SERVICE } from '../sessions/tokens.ts';
import { CONFIG, ORM } from '../shared/tokens.ts';
import { ContextService } from './application/context.service.ts';
import { LinksService, REFRESH_MS } from './application/links.service.ts';
import { decisionReader } from './infrastructure/links/decision-reader.ts';
import {
  confluenceReader,
  GithubReader,
  jiraReader,
  pageReader,
  scriptedReaders,
} from './infrastructure/links/readers.ts';
import {
  MikroOrmArchitectureStore,
  MikroOrmDecisionRepository,
  MikroOrmSocleRepository,
} from './infrastructure/persistence/context.repositories.ts';
import { MikroOrmIntegrationStore, MikroOrmLinkRepository } from './infrastructure/persistence/links.repositories.ts';
import { ContextController } from './interface/http/context.controller.ts';
import { LinksController } from './interface/http/links.controller.ts';
import { CONTEXT_SERVICE, LINKS_SERVICE } from './tokens.ts';

const clock = { now: () => new Date() };

/**
 * Contexte des agents (RF-CONT-01 à 05, 10, 11) : décisions, socles, architecture, et liens des tâches lus par leurs
 * intégrations ; les dépôts viennent des sessions.
 */
@Module({
  imports: [SessionsModule],
  controllers: [ContextController, LinksController],
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
          clock,
        ),
    },
    {
      provide: LINKS_SERVICE,
      inject: [CONFIG, ORM, CONTEXT_SERVICE],
      useFactory: (config: Config, orm: MikroORM, context: ContextService) => {
        const github = config.testing ? scriptedReaders : new GithubReader(config.worker.gh);
        const readers = config.testing
          ? { ...scriptedReaders, decision: decisionReader(context) }
          : {
              github: github as GithubReader,
              jira: jiraReader,
              confluence: confluenceReader,
              page: pageReader,
              decision: decisionReader(context),
            };
        return new LinksService(
          new MikroOrmLinkRepository(orm),
          new MikroOrmIntegrationStore(orm),
          readers,
          github,
          clock,
        );
      },
    },
  ],
  exports: [CONTEXT_SERVICE, LINKS_SERVICE],
})
export class ContextModule implements OnApplicationBootstrap, OnApplicationShutdown {
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(
    @Inject(LINKS_SERVICE) private readonly links: LinksService,
    @Inject(CONFIG) private readonly config: Config,
  ) {}

  /** Les liens sont relus toutes les heures (E10a). */
  onApplicationBootstrap(): void {
    if (this.config.testing) return;
    this.timer = setInterval(() => void this.links.refreshAll().catch(() => undefined), REFRESH_MS);
    this.timer.unref();
  }

  onApplicationShutdown(): void {
    clearInterval(this.timer);
  }
}
