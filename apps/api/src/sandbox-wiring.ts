import { Inject, Injectable, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { userInfo } from 'node:os';
import { join } from 'node:path';
import type { Config } from './config.ts';
import type { NotificationService } from './sessions/application/notification.service.ts';
import type { PilotService } from './sessions/application/pilot.service.ts';
import type { SourceService } from './sessions/application/source.service.ts';
import type { IsolationService } from './tasks/application/isolation.service.ts';
import type { ScriptedAgentRunner } from './tasks/infrastructure/worker/scripted-agent.ts';
import { GitSandboxes } from './sessions/infrastructure/sandbox/git-sandboxes.ts';
import { ScriptedSandboxes } from './sessions/infrastructure/sandbox/scripted-sandboxes.ts';
import { NOTIFICATION_SERVICE, PILOT_SERVICE, SOURCE_SERVICE } from './sessions/tokens.ts';
import { CONFIG } from './shared/tokens.ts';
import { DockerAgentRunner } from './tasks/infrastructure/worker/docker-agent-runner.ts';
import { DockerSandboxContainers } from './tasks/infrastructure/worker/docker-sandbox-containers.ts';
import { AGENT_RUNNER, ISOLATION_SERVICE } from './tasks/tokens.ts';

/** Entretien des bacs à sable : arrêt après 30 min sans message, notification de la veille, suppression (règle 12). */
const HOUSEKEEPING_MS = 60 * 1000;

/**
 * Bacs à sable des sessions pilotées (DT-37) : ils croisent deux contextes. Les sessions les pilotent ; l'isolation
 * des agents du worker (image, limites, proxy de sortie, accès à l'abonnement) leur fournit leurs conteneurs.
 */
@Injectable()
export class SandboxWiring implements OnApplicationBootstrap, OnApplicationShutdown {
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(
    @Inject(CONFIG) private readonly config: Config,
    @Inject(PILOT_SERVICE) private readonly pilot: PilotService,
    @Inject(SOURCE_SERVICE) private readonly sources: SourceService,
    @Inject(NOTIFICATION_SERVICE) private readonly notifications: NotificationService,
    @Inject(AGENT_RUNNER) private readonly runner: DockerAgentRunner | ScriptedAgentRunner,
    @Inject(ISOLATION_SERVICE) private readonly isolation: IsolationService,
  ) {}

  onApplicationBootstrap(): void {
    const root = join(this.config.dataDir, 'sandboxes');
    const { gid, uid } = userInfo();
    const sandboxes =
      this.runner instanceof DockerAgentRunner
        ? new GitSandboxes(
            root,
            new DockerSandboxContainers(this.runner, {
              claudeBinary: this.config.worker.claudeBinary,
              user: `${uid}:${gid}`,
            }),
            async (profile) => {
              const secrets = await this.isolation.workerSecrets(profile);
              return secrets.credentials;
            },
          )
        : new ScriptedSandboxes(root);
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
    this.timer = setInterval(() => void this.pilot.housekeeping().catch(() => undefined), HOUSEKEEPING_MS);
    this.timer.unref();
  }

  onApplicationShutdown(): void {
    clearInterval(this.timer);
  }
}
