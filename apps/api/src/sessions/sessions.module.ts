import type { MikroORM } from '@mikro-orm/sqlite';
import { Inject, Module, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { APP_NAME } from '@bosco/domain';
import type { Config } from '../config.ts';
import type { Notifier } from './application/ports.ts';
import { CONFIG, ORM } from '../shared/tokens.ts';
import { ConversationService } from './application/conversation.service.ts';
import { HistoryService } from './application/history.service.ts';
import { LiveSignalService } from './application/live-signal.service.ts';
import { LiveTrackingService } from './application/live-tracking.service.ts';
import { SessionService } from './application/session.service.ts';
import { SettingsService } from './application/settings.service.ts';
import { SourceService } from './application/source.service.ts';
import { RepositoryDiscovery } from './domain/repository-discovery.ts';
import { FileConversationReader } from './infrastructure/claude-code/conversation-reader.ts';
import { FileProfileFinder } from './infrastructure/claude-code/profile-finder.ts';
import { FileProfileSettings } from './infrastructure/claude-code/profile-settings.ts';
import { FileSessionRegistry } from './infrastructure/claude-code/session-registry.ts';
import { FileTranscriptWatcher } from './infrastructure/claude-code/transcript-watcher.ts';
import { SessionEventsBus } from './infrastructure/events/session-events.bus.ts';
import { GitWorktreeOrigins } from './infrastructure/git/worktree-origins.ts';
import { loadHookSecret } from './infrastructure/hooks/hook-secret.ts';
import { DesktopNotifier, RecordingNotifier } from './infrastructure/notifications/desktop-notifier.ts';
import { MikroOrmSessionRepository } from './infrastructure/persistence/session.repository.ts';
import { MikroOrmSettingsRepository } from './infrastructure/persistence/settings.repository.ts';
import { MikroOrmSourceRepository } from './infrastructure/persistence/source.repository.ts';
import { MikroOrmTaskLinkStore } from './infrastructure/persistence/task-link.store.ts';
import { TranscriptCursorStore } from './infrastructure/persistence/transcript-cursor.store.ts';
import { EventsController } from './interface/http/events.controller.ts';
import { HistoryController } from './interface/http/history.controller.ts';
import { HooksController } from './interface/http/hooks.controller.ts';
import { LiveTrackingController } from './interface/http/live-tracking.controller.ts';
import { SessionsController } from './interface/http/sessions.controller.ts';
import { SettingsController } from './interface/http/settings.controller.ts';
import { SourcesController } from './interface/http/sources.controller.ts';
import {
  CONVERSATION_SERVICE,
  HISTORY_SERVICE,
  HOOK_SECRET,
  LIVE_SIGNAL_SERVICE,
  LIVE_TRACKING_SERVICE,
  NOTIFIER,
  SESSION_EVENTS,
  SESSION_SERVICE,
  SETTINGS_SERVICE,
  SOURCE_SERVICE,
  TRANSCRIPT_WATCHER,
} from './tokens.ts';

const clock = { now: () => new Date() };
const registry = new FileSessionRegistry();
const conversations = new FileConversationReader();
const worktrees = new GitWorktreeOrigins();

/** Contexte des sessions : chaque port du domaine relié à son adaptateur. */
@Module({
  controllers: [
    SourcesController,
    SessionsController,
    EventsController,
    HooksController,
    LiveTrackingController,
    SettingsController,
    HistoryController,
  ],
  providers: [
    { provide: SESSION_EVENTS, useValue: new SessionEventsBus() },
    {
      provide: CONVERSATION_SERVICE,
      inject: [ORM],
      useFactory: (orm: MikroORM) =>
        new ConversationService(new MikroOrmSessionRepository(orm), new MikroOrmSourceRepository(orm), conversations),
    },
    {
      provide: HISTORY_SERVICE,
      inject: [ORM, SESSION_SERVICE],
      useFactory: (orm: MikroORM, sessionService: SessionService) =>
        new HistoryService(sessionService, new MikroOrmSessionRepository(orm), () => clock.now()),
    },
    {
      provide: SETTINGS_SERVICE,
      inject: [ORM],
      useFactory: (orm: MikroORM) => new SettingsService(new MikroOrmSettingsRepository(orm)),
    },
    {
      provide: NOTIFIER,
      inject: [CONFIG],
      useFactory: (config: Config) => (config.testing ? new RecordingNotifier() : new DesktopNotifier(APP_NAME)),
    },
    { provide: HOOK_SECRET, inject: [CONFIG], useFactory: (config: Config) => loadHookSecret(config.dataDir) },
    {
      provide: LIVE_SIGNAL_SERVICE,
      inject: [ORM, SESSION_SERVICE, SESSION_EVENTS, SETTINGS_SERVICE, NOTIFIER],
      useFactory: (
        orm: MikroORM,
        sessionService: SessionService,
        bus: SessionEventsBus,
        settings: SettingsService,
        notifier: Notifier,
      ) =>
        new LiveSignalService(
          new MikroOrmSessionRepository(orm),
          sessionService,
          bus,
          clock,
          { next: randomUUID },
          (title, body) => {
            if (settings.desktopNotifications()) notifier.notify(title, body);
          },
        ),
    },
    {
      provide: LIVE_TRACKING_SERVICE,
      inject: [ORM, CONFIG, HOOK_SECRET, LIVE_SIGNAL_SERVICE],
      useFactory: (orm: MikroORM, config: Config, secret: string, liveSignals: LiveSignalService) =>
        new LiveTrackingService(
          new MikroOrmSourceRepository(orm),
          new FileProfileSettings(),
          (sourceId) => ({ secret, url: `http://${config.host}:${config.port}/api/hooks/${sourceId}` }),
          (sourceId) => liveSignals.lastSignalAt(sourceId),
        ),
    },
    {
      provide: SESSION_SERVICE,
      inject: [ORM, SESSION_EVENTS, SETTINGS_SERVICE, CONFIG],
      useFactory: (orm: MikroORM, bus: SessionEventsBus, settings: SettingsService, config: Config) =>
        new SessionService(
          new MikroOrmSessionRepository(orm),
          clock,
          bus,
          registry,
          () => settings.inactivityDelayMs(),
          (gitRoot, path) =>
            new RepositoryDiscovery(
              settings.repositories(),
              config.profilesRoot,
              (root) => worktrees.originOf(root),
              (folder) => worktrees.rootOf(folder),
            ).placeOf(gitRoot, path),
        ),
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
  exports: [
    TRANSCRIPT_WATCHER,
    LIVE_SIGNAL_SERVICE,
    NOTIFIER,
    SETTINGS_SERVICE,
    SESSION_SERVICE,
    SOURCE_SERVICE,
    HOOK_SECRET,
  ],
})
export class SessionsModule implements OnApplicationBootstrap, OnApplicationShutdown {
  constructor(
    @Inject(SOURCE_SERVICE) private readonly sourceService: SourceService,
    @Inject(TRANSCRIPT_WATCHER) private readonly watcher: FileTranscriptWatcher,
    @Inject(LIVE_SIGNAL_SERVICE) private readonly liveSignals: LiveSignalService,
    @Inject(SETTINGS_SERVICE) private readonly settings: SettingsService,
    @Inject(SESSION_SERVICE) private readonly sessions: SessionService,
    @Inject(ORM) private readonly orm: MikroORM,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.settings.load();
    await this.sessions.useTaskLinks(new MikroOrmTaskLinkStore(this.orm));
    await this.liveSignals.dropStalePermissions();
    await this.sourceService.resumeWatching();
  }

  async onApplicationShutdown(): Promise<void> {
    registry.close();
    await this.watcher.close();
  }
}
