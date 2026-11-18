import type { MikroORM } from '@mikro-orm/sqlite';
import { Inject, Module, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_NAME } from '@bosco/domain';
import type { Config } from '../config.ts';
import type { DesktopAlerts } from './application/notification.service.ts';
import { CONFIG, ORM } from '../shared/tokens.ts';
import { ChannelService } from './application/channel.service.ts';
import { ConversationService } from './application/conversation.service.ts';
import { HistoryService } from './application/history.service.ts';
import { LiveSignalService } from './application/live-signal.service.ts';
import { LiveTrackingService } from './application/live-tracking.service.ts';
import { NotificationService } from './application/notification.service.ts';
import { PilotService } from './application/pilot.service.ts';
import { SessionDefaultsService } from './application/session-defaults.service.ts';
import { SessionService } from './application/session.service.ts';
import { SettingsService } from './application/settings.service.ts';
import { SourceRemovalService } from './application/source-removal.service.ts';
import { SourceService } from './application/source.service.ts';
import { SuggestionService } from './application/suggestion.service.ts';
import { UsageBackfillService } from './application/usage-backfill.service.ts';
import { UsageService } from './application/usage.service.ts';
import { ClaudeChannelInstaller } from './infrastructure/claude-code/channel-installer.ts';
import { ClaudeTurnRunner } from './infrastructure/claude-code/claude-turn-runner.ts';
import { FileConversationReader } from './infrastructure/claude-code/conversation-reader.ts';
import { ClaudeMcpServerInstaller, MCP_SERVER } from './infrastructure/claude-code/mcp-server-installer.ts';
import { FileProfileFinder } from './infrastructure/claude-code/profile-finder.ts';
import { FileProfileSettings } from './infrastructure/claude-code/profile-settings.ts';
import { FileSessionRegistry } from './infrastructure/claude-code/session-registry.ts';
import { DiskSuggestions } from './infrastructure/claude-code/suggestions.ts';
import { FileTranscriptFiles } from './infrastructure/claude-code/transcript-files.ts';
import { FileTranscriptReplay } from './infrastructure/claude-code/transcript-replay.ts';
import { FileTranscriptWatcher } from './infrastructure/claude-code/transcript-watcher.ts';
import { SessionEventsBus } from './infrastructure/events/session-events.bus.ts';
import { loadHookSecret } from './infrastructure/hooks/hook-secret.ts';
import { NotifySendAlerts, RecordingNotifier } from './infrastructure/notifications/desktop-notifier.ts';
import { PresenceTracker } from './infrastructure/notifications/presence.ts';
import { MikroOrmHistoryPeriodStore } from './infrastructure/persistence/history-period.store.ts';
import { MikroOrmNotificationRepository } from './infrastructure/persistence/notification.repository.ts';
import { MikroOrmPilotRepository } from './infrastructure/persistence/pilot.repository.ts';
import { MikroOrmProfileDefaultsRepository } from './infrastructure/persistence/profile-defaults.repository.ts';
import { MikroOrmSessionRepository } from './infrastructure/persistence/session.repository.ts';
import { MikroOrmSettingsRepository } from './infrastructure/persistence/settings.repository.ts';
import { MikroOrmSourceRecords } from './infrastructure/persistence/source-records.ts';
import { MikroOrmSourceRepository } from './infrastructure/persistence/source.repository.ts';
import { TranscriptCursorStore } from './infrastructure/persistence/transcript-cursor.store.ts';
import { ChannelController } from './interface/http/channel.controller.ts';
import { EventsController } from './interface/http/events.controller.ts';
import { HistoryController } from './interface/http/history.controller.ts';
import { HooksController } from './interface/http/hooks.controller.ts';
import { LiveTrackingController } from './interface/http/live-tracking.controller.ts';
import { NotificationsController } from './interface/http/notifications.controller.ts';
import { PilotController } from './interface/http/pilot.controller.ts';
import { SessionsController } from './interface/http/sessions.controller.ts';
import { SettingsController } from './interface/http/settings.controller.ts';
import { SourcesController } from './interface/http/sources.controller.ts';
import { UsageController } from './interface/http/usage.controller.ts';
import {
  CHANNEL_INSTALLER,
  CHANNEL_SERVICE,
  CONVERSATION_SERVICE,
  HISTORY_SERVICE,
  HOOK_SECRET,
  LIVE_SIGNAL_SERVICE,
  LIVE_TRACKING_SERVICE,
  NOTIFICATION_SERVICE,
  NOTIFIER,
  PILOT_SERVICE,
  PRESENCE,
  SESSION_DEFAULTS_SERVICE,
  SESSION_EVENTS,
  SESSION_SERVICE,
  SETTINGS_SERVICE,
  SOURCE_REMOVAL_SERVICE,
  SOURCE_SERVICE,
  SUGGESTION_SERVICE,
  TRANSCRIPT_WATCHER,
  USAGE_SERVICE,
} from './tokens.ts';

const clock = { now: () => new Date() };
const registry = new FileSessionRegistry();
const conversations = new FileConversationReader();

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
    UsageController,
    NotificationsController,
    PilotController,
    ChannelController,
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
        new HistoryService(sessionService, new MikroOrmSessionRepository(orm)),
    },
    {
      provide: USAGE_SERVICE,
      inject: [ORM, SESSION_SERVICE],
      useFactory: (orm: MikroORM, sessionService: SessionService) =>
        new UsageService(
          new MikroOrmSessionRepository(orm),
          sessionService,
          new MikroOrmSourceRepository(orm),
          new MikroOrmPilotRepository(orm),
          clock,
        ),
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
        // L'icône de Bosco, servie par l'interface : la notification du bureau la montre
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
          new ClaudeMcpServerInstaller(config.pilotClaude, config.profilesRoot, MCP_SERVER, {
            secret,
            url: `http://${config.host}:${config.port}/mcp`,
          }),
        ),
    },
    {
      provide: SESSION_SERVICE,
      inject: [ORM, SESSION_EVENTS, SETTINGS_SERVICE],
      useFactory: (orm: MikroORM, bus: SessionEventsBus, settings: SettingsService) =>
        new SessionService(new MikroOrmSessionRepository(orm), clock, bus, registry, () =>
          settings.inactivityDelayMs(),
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
      provide: SESSION_DEFAULTS_SERVICE,
      inject: [ORM, SESSION_SERVICE],
      useFactory: (orm: MikroORM, sessionService: SessionService) =>
        new SessionDefaultsService(
          new MikroOrmSourceRepository(orm),
          new MikroOrmProfileDefaultsRepository(orm),
          new FileProfileSettings(),
          sessionService,
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
          new FileTranscriptFiles(),
        ),
    },
    {
      provide: CHANNEL_SERVICE,
      inject: [ORM, SESSION_SERVICE, SESSION_EVENTS],
      useFactory: (orm: MikroORM, sessionService: SessionService, bus: SessionEventsBus) =>
        new ChannelService(new MikroOrmSessionRepository(orm), sessionService, bus),
    },
    {
      provide: CHANNEL_INSTALLER,
      inject: [CONFIG],
      useFactory: (config: Config) =>
        // Claude Code lance la commande `channel` de Bosco, qui retrouve le service par son port et son dossier
        new ClaudeChannelInstaller(
          config.pilotClaude,
          {
            command: process.execPath,
            args: [fileURLToPath(new URL('../cli/main.js', import.meta.url)), 'channel'],
            env: { BOSCO_PORT: String(config.port), BOSCO_DATA_DIR: config.dataDir },
          },
          config.profilesRoot,
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
          new MikroOrmHistoryPeriodStore(orm),
          new MikroOrmSourceRecords(orm),
          { service: sessionService, sessions: registry },
        ),
    },
    {
      provide: SOURCE_REMOVAL_SERVICE,
      inject: [ORM, TRANSCRIPT_WATCHER, LIVE_TRACKING_SERVICE, CHANNEL_INSTALLER, PILOT_SERVICE, LIVE_SIGNAL_SERVICE],
      useFactory: (
        orm: MikroORM,
        watcher: FileTranscriptWatcher,
        liveTracking: LiveTrackingService,
        channel: ClaudeChannelInstaller,
        pilot: PilotService,
        liveSignals: LiveSignalService,
      ) =>
        new SourceRemovalService(
          new MikroOrmSourceRepository(orm),
          new MikroOrmSourceRecords(orm),
          watcher,
          registry,
          liveTracking,
          channel,
          pilot,
          liveSignals,
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
    SOURCE_REMOVAL_SERVICE,
    LIVE_TRACKING_SERVICE,
    CHANNEL_INSTALLER,
    HOOK_SECRET,
    PILOT_SERVICE,
    SESSION_DEFAULTS_SERVICE,
    CHANNEL_SERVICE,
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
    @Inject(CHANNEL_SERVICE) private readonly channel: ChannelService,
    @Inject(SESSION_DEFAULTS_SERVICE) private readonly defaults: SessionDefaultsService,
  ) {}

  /** L'usage des sessions lues avant qu'il soit gardé tour par tour se relit en arrière-plan, sans retenir le démarrage. */
  private completeUsage(): void {
    const backfill = new UsageBackfillService(
      new MikroOrmSessionRepository(this.orm),
      new MikroOrmSourceRepository(this.orm),
      new FileTranscriptReplay(),
    );
    void backfill.completeUsage().catch((error: unknown) => {
      console.warn(`usage backfill stopped: ${error instanceof Error ? error.message : String(error)}`);
    });
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.settings.load();
    this.sessions.useNotifications(this.notifications);
    this.sessions.usePilots(this.pilot);
    this.pilot.useChannel(this.channel);
    this.pilot.useDefaults(this.defaults);
    this.liveSignals.usePilots(this.pilot);
    await this.pilot.load();
    await this.liveSignals.dropStalePermissions();
    await this.sourceService.resumeWatching();
    this.completeUsage();
  }

  async onApplicationShutdown(): Promise<void> {
    this.pilot.stopAll();
    registry.close();
    await this.watcher.close();
  }
}
