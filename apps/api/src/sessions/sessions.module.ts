import type { MikroORM } from '@mikro-orm/sqlite';
import { Inject, Module, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { APP_NAME } from '@bosco/domain';
import type { Config } from '../config.ts';
import type { DesktopAlerts } from './application/notification.service.ts';
import { CONFIG, ORM } from '../shared/tokens.ts';
import { ConversationService } from './application/conversation.service.ts';
import { HistoryService } from './application/history.service.ts';
import { LiveSignalService } from './application/live-signal.service.ts';
import { LiveTrackingService } from './application/live-tracking.service.ts';
import { NotificationService } from './application/notification.service.ts';
import { PilotService } from './application/pilot.service.ts';
import { SessionService } from './application/session.service.ts';
import { SettingsService } from './application/settings.service.ts';
import { SourceService } from './application/source.service.ts';
import { SuggestionService } from './application/suggestion.service.ts';
import { RepositoryDiscovery } from './domain/repository-discovery.ts';
import { ClaudeTurnRunner } from './infrastructure/claude-code/claude-turn-runner.ts';
import { FileConversationReader } from './infrastructure/claude-code/conversation-reader.ts';
import { FileProfileFinder } from './infrastructure/claude-code/profile-finder.ts';
import { FileProfileSettings } from './infrastructure/claude-code/profile-settings.ts';
import { FileSessionRegistry } from './infrastructure/claude-code/session-registry.ts';
import { DiskSuggestions } from './infrastructure/claude-code/suggestions.ts';
import { FileTranscriptWatcher } from './infrastructure/claude-code/transcript-watcher.ts';
import { SessionEventsBus } from './infrastructure/events/session-events.bus.ts';
import { GitWorktreeOrigins } from './infrastructure/git/worktree-origins.ts';
import { loadHookSecret } from './infrastructure/hooks/hook-secret.ts';
import { NotifySendAlerts, RecordingNotifier } from './infrastructure/notifications/desktop-notifier.ts';
import { PresenceTracker } from './infrastructure/notifications/presence.ts';
import { MikroOrmNotificationRepository } from './infrastructure/persistence/notification.repository.ts';
import { MikroOrmPilotRepository } from './infrastructure/persistence/pilot.repository.ts';
import { MikroOrmSessionRepository } from './infrastructure/persistence/session.repository.ts';
import { MikroOrmSettingsRepository } from './infrastructure/persistence/settings.repository.ts';
import { MikroOrmSourceRepository } from './infrastructure/persistence/source.repository.ts';
import { MikroOrmTaskLinkStore } from './infrastructure/persistence/task-link.store.ts';
import { TranscriptCursorStore } from './infrastructure/persistence/transcript-cursor.store.ts';
import { EventsController } from './interface/http/events.controller.ts';
import { HistoryController } from './interface/http/history.controller.ts';
import { HooksController } from './interface/http/hooks.controller.ts';
import { LiveTrackingController } from './interface/http/live-tracking.controller.ts';
import { NotificationsController } from './interface/http/notifications.controller.ts';
import { PilotController } from './interface/http/pilot.controller.ts';
import { SessionsController } from './interface/http/sessions.controller.ts';
import { SettingsController } from './interface/http/settings.controller.ts';
import { SourcesController } from './interface/http/sources.controller.ts';
import {
  CONVERSATION_SERVICE,
  HISTORY_SERVICE,
  HOOK_SECRET,
  LIVE_SIGNAL_SERVICE,
  LIVE_TRACKING_SERVICE,
  NOTIFICATION_SERVICE,
  NOTIFIER,
  PILOT_SERVICE,
  PRESENCE,
  SESSION_EVENTS,
  SESSION_SERVICE,
  SETTINGS_SERVICE,
  SOURCE_SERVICE,
  SUGGESTION_SERVICE,
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
    NotificationsController,
    PilotController,
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
      useFactory: (config: Config) => {
        if (config.testing) return new RecordingNotifier();
        // L'icône de Bosco, servie par l'interface : la notification du bureau la montre (E15b)
        const icon = config.webDir ? join(config.webDir, 'public', 'logo.svg') : null;
        return new NotifySendAlerts(APP_NAME, icon);
      },
    },
    { provide: PRESENCE, useValue: new PresenceTracker(() => clock.now()) },
    {
      provide: NOTIFICATION_SERVICE,
      inject: [ORM, SETTINGS_SERVICE, NOTIFIER, PRESENCE, SESSION_EVENTS, CONFIG],
      useFactory: (
        orm: MikroORM,
        settings: SettingsService,
        desktop: DesktopAlerts,
        presence: PresenceTracker,
        bus: SessionEventsBus,
        config: Config,
      ) =>
        new NotificationService(
          new MikroOrmNotificationRepository(orm),
          settings,
          desktop,
          presence,
          bus,
          clock,
          `http://${config.host}:${config.port}`,
        ),
    },
    { provide: HOOK_SECRET, inject: [CONFIG], useFactory: (config: Config) => loadHookSecret(config.dataDir) },
    {
      provide: LIVE_SIGNAL_SERVICE,
      inject: [ORM, SESSION_SERVICE, SESSION_EVENTS, NOTIFICATION_SERVICE],
      useFactory: (
        orm: MikroORM,
        sessionService: SessionService,
        bus: SessionEventsBus,
        notifications: NotificationService,
      ) =>
        new LiveSignalService(
          new MikroOrmSessionRepository(orm),
          sessionService,
          bus,
          clock,
          { next: randomUUID },
          notifications,
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
      provide: PILOT_SERVICE,
      inject: [ORM, CONFIG, LIVE_SIGNAL_SERVICE, SESSION_SERVICE, SESSION_EVENTS],
      useFactory: (
        orm: MikroORM,
        config: Config,
        liveSignals: LiveSignalService,
        sessionService: SessionService,
        bus: SessionEventsBus,
      ) =>
        new PilotService(
          new MikroOrmPilotRepository(orm),
          new ClaudeTurnRunner(config.pilotClaude),
          liveSignals,
          sessionService,
          new MikroOrmSessionRepository(orm),
          new MikroOrmSourceRepository(orm),
          registry,
          bus,
          clock,
          { next: randomUUID },
        ),
    },
    {
      provide: SUGGESTION_SERVICE,
      inject: [ORM],
      useFactory: (orm: MikroORM) =>
        new SuggestionService(
          new DiskSuggestions(),
          new MikroOrmSessionRepository(orm),
          new MikroOrmSourceRepository(orm),
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
    NOTIFICATION_SERVICE,
    PRESENCE,
    SETTINGS_SERVICE,
    SESSION_SERVICE,
    SOURCE_SERVICE,
    HOOK_SECRET,
    PILOT_SERVICE,
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
    @Inject(NOTIFICATION_SERVICE) private readonly notifications: NotificationService,
    @Inject(PILOT_SERVICE) private readonly pilot: PilotService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.settings.load();
    this.sessions.useNotifications(this.notifications);
    this.sessions.usePilots(this.pilot);
    this.liveSignals.usePilots(this.pilot);
    await this.pilot.load();
    await this.sessions.useTaskLinks(new MikroOrmTaskLinkStore(this.orm));
    await this.liveSignals.dropStalePermissions();
    await this.sourceService.resumeWatching();
  }

  async onApplicationShutdown(): Promise<void> {
    this.pilot.stopAll();
    registry.close();
    await this.watcher.close();
  }
}
