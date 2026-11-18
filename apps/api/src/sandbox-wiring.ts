import { Inject, Injectable, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { join } from 'node:path';
import type { Config } from './config.ts';
import type { IsolationService } from './isolation/application/isolation.service.ts';
import type { QuotaService } from './isolation/application/quota.service.ts';
import type { DockerIsolation } from './isolation/infrastructure/docker/docker-isolation.ts';
import type { ProjectService } from './projects/application/project.service.ts';
import type { NotificationService } from './sessions/application/notification.service.ts';
import type { PilotService } from './sessions/application/pilot.service.ts';
import type { SessionDefaultsService } from './sessions/application/session-defaults.service.ts';
import type { SourceService } from './sessions/application/source.service.ts';
import { DockerSandboxContainers } from './isolation/infrastructure/docker/docker-sandbox-containers.ts';
import { AllowListFile } from './isolation/infrastructure/egress/allow-list-file.ts';
import { DOCKER_ISOLATION, ISOLATION_SERVICE, QUOTA_SERVICE } from './isolation/tokens.ts';
import { PROJECT_SERVICE } from './projects/tokens.ts';
import { GitSandboxes } from './sessions/infrastructure/sandbox/git-sandboxes.ts';
import { ScriptedSandboxes } from './sessions/infrastructure/sandbox/scripted-sandboxes.ts';
import { NOTIFICATION_SERVICE, PILOT_SERVICE, SESSION_DEFAULTS_SERVICE, SOURCE_SERVICE } from './sessions/tokens.ts';
import { CONFIG } from './shared/tokens.ts';

/** Entretien des bacs à sable : arrêt après 30 min sans message, notification de la veille, suppression (règle 12). */
const HOUSEKEEPING_MS = 60 * 1000;

/**
 * Bacs à sable des sessions pilotées (DT-37) : ils croisent trois contextes. Les sessions les pilotent ; l'isolation
 * leur fournit leurs conteneurs (image, limites, proxy de sortie), l'accès à l'abonnement et son quota ; les projets,
 * leurs domaines propres.
 */
@Injectable()
export class SandboxWiring implements OnApplicationBootstrap, OnApplicationShutdown {
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(
    @Inject(CONFIG) private readonly config: Config,
    @Inject(PILOT_SERVICE) private readonly pilot: PilotService,
    @Inject(SOURCE_SERVICE) private readonly sources: SourceService,
    @Inject(NOTIFICATION_SERVICE) private readonly notifications: NotificationService,
    @Inject(DOCKER_ISOLATION) private readonly docker: DockerIsolation,
    @Inject(ISOLATION_SERVICE) private readonly isolation: IsolationService,
    @Inject(QUOTA_SERVICE) private readonly quota: QuotaService,
    @Inject(PROJECT_SERVICE) private readonly projects: ProjectService,
    @Inject(SESSION_DEFAULTS_SERVICE) private readonly defaults: SessionDefaultsService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    // Les domaines propres à chaque projet rejoignent la liste générale, dans le proxy de ses bacs à sable (E21a)
    const allowList = new AllowListFile(this.docker.options.allowDir);
    await this.projects.useDomains({ publish: (projects) => allowList.publishProjects(projects) });
    const root = join(this.config.dataDir, 'sandboxes');
    // Dans les scénarios, des bacs à sable scriptés : ni Docker ni copie du projet
    const sandboxes = this.config.testing
      ? new ScriptedSandboxes(root)
      : new GitSandboxes(root, new DockerSandboxContainers(this.docker), (profile) =>
          this.isolation.credentialsOf(profile),
        );
    this.pilot.useSandboxes({
      sandboxes,
      ensureSource: (path) => this.sources.ensureSource(path),
      warn: async (sessionId, branch) => {
        await this.notifications.notify(
          { kind: 'sandbox' },
          {
            excerpt: `Supprimé demain : la branche ${branch} a du travail non récupéré.`,
            place: null,
            sessionId,
            taskId: null,
            title: 'Bac à sable',
          },
        );
      },
    });
    // Une nouvelle session prend l'abonnement par défaut, réglé dans « Abonnement Claude » (E11), sauf si un groupe ou
    // son projet en règlent un autre
    const profiles = {
      subscriptions: async () => {
        const { subscription } = await this.isolation.snapshot();
        return { choices: subscription.choices, effective: subscription.profile };
      },
    };
    this.pilot.useProfiles(profiles);
    this.defaults.useProfiles(profiles);
    // Le quota de l'abonnement se lit dans chaque tour piloté ; ses seuils retiennent puis arrêtent les tours (DT-39)
    this.pilot.useQuota({
      record: (profile, windows) => void this.quota.record(profile, windows).catch(() => undefined),
      holdReason: (profile, sandboxed) => this.quota.holdReason(profile, sandboxed),
      stopReason: (profile, sandboxed) => this.quota.stopReason(profile, sandboxed),
    });
    this.timer = setInterval(() => void this.pilot.housekeeping().catch(() => undefined), HOUSEKEEPING_MS);
    this.timer.unref();
  }

  onApplicationShutdown(): void {
    clearInterval(this.timer);
  }
}
