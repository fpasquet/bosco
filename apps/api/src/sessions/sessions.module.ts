import type { MikroORM } from '@mikro-orm/sqlite';
import { Inject, Module, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Config } from '../config.ts';
import { CONFIG, ORM } from '../shared/tokens.ts';
import { SessionService } from './application/session.service.ts';
import { SourceService } from './application/source.service.ts';
import { FileProfileFinder } from './infrastructure/claude-code/profile-finder.ts';
import { FileSessionRegistry } from './infrastructure/claude-code/session-registry.ts';
import { FileTranscriptWatcher } from './infrastructure/claude-code/transcript-watcher.ts';
import { SessionEventsBus } from './infrastructure/events/session-events.bus.ts';
import { MikroOrmSessionRepository } from './infrastructure/persistence/session.repository.ts';
import { MikroOrmSourceRepository } from './infrastructure/persistence/source.repository.ts';
import { TranscriptCursorStore } from './infrastructure/persistence/transcript-cursor.store.ts';
import { EventsController } from './interface/http/events.controller.ts';
import { SessionsController } from './interface/http/sessions.controller.ts';
import { SourcesController } from './interface/http/sources.controller.ts';
import { SESSION_EVENTS, SESSION_SERVICE, SOURCE_SERVICE, TRANSCRIPT_WATCHER } from './tokens.ts';

const clock = { now: () => new Date() };
const registry = new FileSessionRegistry();

/** Contexte des sessions : chaque port du domaine relié à son adaptateur. */
@Module({
  controllers: [SourcesController, SessionsController, EventsController],
  providers: [
    { provide: SESSION_EVENTS, useValue: new SessionEventsBus() },
    {
      provide: SESSION_SERVICE,
      inject: [ORM, SESSION_EVENTS],
      useFactory: (orm: MikroORM, bus: SessionEventsBus) =>
        new SessionService(new MikroOrmSessionRepository(orm), clock, bus, registry),
    },
    {
      provide: TRANSCRIPT_WATCHER,
      inject: [SESSION_SERVICE, ORM, SESSION_EVENTS],
      useFactory: (sessionService: SessionService, orm: MikroORM, bus: SessionEventsBus) =>
        new FileTranscriptWatcher(sessionService, new TranscriptCursorStore(orm), (progress) =>
          bus.importProgress.next(progress),
        ),
    },
    {
      provide: SOURCE_SERVICE,
      inject: [ORM, CONFIG, TRANSCRIPT_WATCHER, SESSION_SERVICE],
      useFactory: (orm: MikroORM, config: Config, watcher: FileTranscriptWatcher, sessionService: SessionService) =>
        new SourceService(
          new MikroOrmSourceRepository(orm),
          new FileProfileFinder(config.profilesRoot),
          watcher,
          { next: randomUUID },
          clock,
          { service: sessionService, sessions: registry },
        ),
    },
  ],
  exports: [TRANSCRIPT_WATCHER],
})
export class SessionsModule implements OnApplicationBootstrap, OnApplicationShutdown {
  constructor(
    @Inject(SOURCE_SERVICE) private readonly sourceService: SourceService,
    @Inject(TRANSCRIPT_WATCHER) private readonly watcher: FileTranscriptWatcher,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.sourceService.resumeWatching();
  }

  async onApplicationShutdown(): Promise<void> {
    registry.close();
    await this.watcher.close();
  }
}
