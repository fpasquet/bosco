import type { MikroORM } from '@mikro-orm/sqlite';
import { Inject, Module, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SessionService, SourceService } from '@bosco/core/sessions';
import type { Config } from '../config.ts';
import { SessionsController } from '../adapters/in/http/sessions.controller.ts';
import { SourcesController } from '../adapters/in/http/sources.controller.ts';
import { FileTranscriptWatcher } from '../adapters/in/transcripts/transcript-watcher.ts';
import { FileProfileFinder } from '../adapters/out/claude-code/profile-finder.ts';
import { PersistenceModule } from '../adapters/out/persistence/persistence.module.ts';
import { MikroOrmSessionRepository } from '../adapters/out/persistence/session.repository.ts';
import { MikroOrmSourceRepository } from '../adapters/out/persistence/source.repository.ts';
import { TranscriptCursorStore } from '../adapters/out/persistence/transcript-cursor.store.ts';
import { CONFIG, ORM, SESSION_SERVICE, SOURCE_SERVICE, TRANSCRIPT_WATCHER } from '../tokens.ts';

const clock = { now: () => new Date() };

/** Contexte des sessions : chaque port du domaine relié à son adaptateur. */
@Module({
  imports: [PersistenceModule],
  controllers: [SourcesController, SessionsController],
  providers: [
    {
      provide: SESSION_SERVICE,
      inject: [ORM],
      useFactory: (orm: MikroORM) => new SessionService(new MikroOrmSessionRepository(orm), clock),
    },
    {
      provide: TRANSCRIPT_WATCHER,
      inject: [SESSION_SERVICE, ORM],
      useFactory: (sessionService: SessionService, orm: MikroORM) =>
        new FileTranscriptWatcher(sessionService, new TranscriptCursorStore(orm)),
    },
    {
      provide: SOURCE_SERVICE,
      inject: [ORM, CONFIG, TRANSCRIPT_WATCHER],
      useFactory: (orm: MikroORM, config: Config, watcher: FileTranscriptWatcher) =>
        new SourceService(
          new MikroOrmSourceRepository(orm),
          new FileProfileFinder(config.profilesRoot),
          watcher,
          { next: randomUUID },
          clock,
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
    await this.watcher.close();
  }
}
