import type { MikroORM } from '@mikro-orm/sqlite';
import { Body, Controller, Get, HttpCode, Inject, Post } from '@nestjs/common';
import type { AccessService } from './access/application/access.service.ts';
import type { ContainersService } from './isolation/application/containers.service.ts';
import type { IsolationService } from './isolation/application/isolation.service.ts';
import type { QuotaService } from './isolation/application/quota.service.ts';
import type { ScriptedSandboxProbe } from './isolation/infrastructure/docker/scripted-sandbox-probe.ts';
import type { GroupService } from './projects/application/group.service.ts';
import type { ProjectService } from './projects/application/project.service.ts';
import type { ChannelService } from './sessions/application/channel.service.ts';
import type { LiveSignalService } from './sessions/application/live-signal.service.ts';
import type { PilotService } from './sessions/application/pilot.service.ts';
import type { SessionService } from './sessions/application/session.service.ts';
import type { SettingsService } from './sessions/application/settings.service.ts';
import type { SourceService } from './sessions/application/source.service.ts';
import type { FileTranscriptWatcher } from './sessions/infrastructure/claude-code/transcript-watcher.ts';
import type { RecordingNotifier } from './sessions/infrastructure/notifications/desktop-notifier.ts';
import type { PresenceTracker } from './sessions/infrastructure/notifications/presence.ts';
import { ACCESS_SERVICE } from './access/tokens.ts';
import { CONTAINERS_SERVICE, ISOLATION_SERVICE, QUOTA_SERVICE, SANDBOX_PROBE } from './isolation/tokens.ts';
import { GROUP_SERVICE, PROJECT_SERVICE } from './projects/tokens.ts';
import {
  CHANNEL_SERVICE,
  LIVE_SIGNAL_SERVICE,
  NOTIFIER,
  PILOT_SERVICE,
  PRESENCE,
  SESSION_SERVICE,
  SETTINGS_SERVICE,
  SOURCE_SERVICE,
  TRANSCRIPT_WATCHER,
} from './sessions/tokens.ts';
import { ORM } from './shared/tokens.ts';

/** Attente au plus d'un tour piloté encore en cours avant la remise à zéro. */
const TURN_SETTLE_MS = 2000;

/** Route réservée aux scénarios (BOSCO_TEST=1) : remet le service à zéro entre deux scénarios. */
@Controller('__test')
export class TestController {
  constructor(
    @Inject(ORM) private readonly orm: MikroORM,
    @Inject(TRANSCRIPT_WATCHER) private readonly watcher: FileTranscriptWatcher,
    @Inject(LIVE_SIGNAL_SERVICE) private readonly liveSignals: LiveSignalService,
    @Inject(NOTIFIER) private readonly notifier: RecordingNotifier,
    @Inject(PRESENCE) private readonly presence: PresenceTracker,
    @Inject(SETTINGS_SERVICE) private readonly settings: SettingsService,
    @Inject(ACCESS_SERVICE) private readonly access: AccessService,
    @Inject(ISOLATION_SERVICE) private readonly isolation: IsolationService,
    @Inject(SESSION_SERVICE) private readonly sessions: SessionService,
    @Inject(CHANNEL_SERVICE) private readonly channel: ChannelService,
    @Inject(QUOTA_SERVICE) private readonly quota: QuotaService,
    @Inject(PROJECT_SERVICE) private readonly projects: ProjectService,
    @Inject(GROUP_SERVICE) private readonly groups: GroupService,
    @Inject(PILOT_SERVICE) private readonly pilot: PilotService,
    @Inject(SANDBOX_PROBE) private readonly docker: ScriptedSandboxProbe,
    @Inject(CONTAINERS_SERVICE) private readonly containers: ContainersService,
    @Inject(SOURCE_SERVICE) private readonly sources: SourceService,
  ) {}

  /** Simule un Docker qui ne répond plus, ou qui répond de nouveau, à la mesure suivante des conteneurs. */
  @Post('docker')
  @HttpCode(204)
  setDocker(@Body() body: { reachable: boolean }): void {
    this.docker.reachable = body.reachable;
  }

  /** Simule l'usage de l'abonnement par défaut, comme le donnerait un tour : la fenêtre de 5 h, en %. */
  @Post('quota')
  @HttpCode(204)
  async setQuota(@Body() body: { fiveHour: number; profile?: string }): Promise<void> {
    const resetsAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    await this.quota.record(body.profile ?? this.isolation.profileOf(null), {
      fiveHour: { utilization: body.fiveHour / 100, resetsAt },
    });
  }

  /** Notifications du bureau envoyées depuis la dernière remise à zéro. */
  @Get('notifications')
  notifications(): { notifications: { body: string; title: string }[] } {
    return { notifications: this.notifier.sent };
  }

  @Post('reset')
  @HttpCode(204)
  async reset(): Promise<void> {
    // Un tour piloté du scénario précédent finit avant la remise à zéro : sa fin ne déborde pas sur le suivant
    for (let waited = 0; this.pilot.runningTurns().length > 0 && waited < TURN_SETTLE_MS; waited += 50)
      await new Promise((resolve) => setTimeout(resolve, 50));
    this.pilot.stopAll();
    // Un import de tout l'historique du scénario précédent s'arrête avant de vider la base
    await this.sources.stopImport();
    this.docker.reachable = true;
    await this.watcher.close();
    await this.access.disable();
    this.liveSignals.forget();
    this.channel.forget();
    this.notifier.sent.splice(0);
    this.presence.reset();
    await this.orm.schema.clear();
    // L'index de recherche n'est pas une entité : il se vide à part
    await this.orm.em.getConnection().execute('delete from session_search');
    await this.settings.load();
    await this.isolation.load();
    await this.quota.load();
    await this.projects.load();
    await this.groups.load();
    // Les sessions pilotées du scénario précédent sont oubliées : leurs bacs à sable ne se mesurent plus
    await this.pilot.load();
    // Un Docker coupé au scénario précédent répond de nouveau tout de suite, sans attendre l'essai suivant
    await this.containers.measure();
    (globalThis as { boscoReplayReset?: () => void }).boscoReplayReset?.();
  }
}
