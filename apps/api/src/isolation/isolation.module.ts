import type { MikroORM } from '@mikro-orm/sqlite';
import { Inject, Module, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { availableParallelism, userInfo } from 'node:os';
import { join } from 'node:path';
import type { Config } from '../config.ts';
import type { PilotService } from '../sessions/application/pilot.service.ts';
import type { SessionService } from '../sessions/application/session.service.ts';
import type { SourceService } from '../sessions/application/source.service.ts';
import { sandboxKeyOf } from '../sessions/domain/sandbox.ts';
import { SessionsModule } from '../sessions/sessions.module.ts';
import { PILOT_SERVICE, SESSION_SERVICE, SOURCE_SERVICE } from '../sessions/tokens.ts';
import { CONFIG, ORM } from '../shared/tokens.ts';
import { ContainersService, MEASURE_MS, type SandboxProbe } from './application/containers.service.ts';
import { IsolationService } from './application/isolation.service.ts';
import { QuotaService } from './application/quota.service.ts';
import { ContainerEventsBus } from './infrastructure/container-events.bus.ts';
import { FileClaudeProfiles } from './infrastructure/docker/claude-profiles.ts';
import { DockerSandboxProbe } from './infrastructure/docker/docker-containers.ts';
import { AGENT_LIMITS, DockerIsolation } from './infrastructure/docker/docker-isolation.ts';
import { ProcessTreeProbe } from './infrastructure/docker/process-tree.ts';
import { ScriptedSandboxProbe } from './infrastructure/docker/scripted-sandbox-probe.ts';
import { AllowListFile } from './infrastructure/egress/allow-list-file.ts';
import { MikroOrmIsolationStore } from './infrastructure/persistence/isolation.store.ts';
import { MikroOrmQuotaStore } from './infrastructure/persistence/quota.store.ts';
import { ContainersController } from './interface/http/containers.controller.ts';
import { IsolationController } from './interface/http/isolation.controller.ts';
import { QuotaController } from './interface/http/quota.controller.ts';
import {
  CONTAINER_EVENTS,
  CONTAINERS_SERVICE,
  DOCKER_ISOLATION,
  ISOLATION_SERVICE,
  QUOTA_SERVICE,
  SANDBOX_PROBE,
} from './tokens.ts';

const clock = { now: () => new Date() };

/** Liste des domaines autorisés : à la place qu'elle avait avant les bacs à sable, montée par les proxies existants */
const egressDir = (config: Config) => join(config.dataDir, 'worker', 'egress');

/** Mesure des conteneurs dans les scénarios : chaque seconde, pour ne pas attendre 5 s un bac à sable démarré */
const SCRIPTED_MEASURE_MS = 1000;

/**
 * Isolation des bacs à sable : l'image et les limites de l'agent, la liste des domaines de son proxy de sortie,
 * l'abonnement Claude par défaut et son quota, et les conteneurs en cours.
 */
@Module({
  imports: [SessionsModule],
  controllers: [IsolationController, ContainersController, QuotaController],
  providers: [
    {
      provide: QUOTA_SERVICE,
      inject: [ORM],
      useFactory: (orm: MikroORM) => new QuotaService(new MikroOrmQuotaStore(orm), clock),
    },
    {
      provide: ISOLATION_SERVICE,
      inject: [CONFIG, ORM, SOURCE_SERVICE],
      useFactory: (config: Config, orm: MikroORM, sources: SourceService) => {
        const sandboxes = join(config.dataDir, 'sandboxes');
        const worker = join(config.dataDir, 'worker');
        // Les profils surveillés, sans ceux de Bosco, qui ne gardent que les conversations de ses agents
        const profiles = async () => {
          const view = await sources.listSources();
          return view.sources
            .filter(({ path }) => path !== worker && !path.startsWith(`${sandboxes}/`))
            .map(({ label, path, tokenFile }) => ({ label, path, tokenFile }));
        };
        return new IsolationService(new MikroOrmIsolationStore(orm), new AllowListFile(egressDir(config)), {
          defaults: { credentials: config.worker.credentials },
          profiles: new FileClaudeProfiles(profiles),
        });
      },
    },
    {
      provide: DOCKER_ISOLATION,
      inject: [CONFIG, ISOLATION_SERVICE],
      useFactory: (config: Config, isolation: IsolationService) => {
        const { gid, uid } = userInfo();
        return new DockerIsolation({
          allowDir: egressDir(config),
          claudeBinary: config.worker.claudeBinary,
          access: () => isolation.accessOf(),
          user: `${uid}:${gid}`,
        });
      },
    },
    { provide: CONTAINER_EVENTS, useValue: new ContainerEventsBus() },
    {
      provide: SANDBOX_PROBE,
      inject: [CONFIG, PILOT_SERVICE],
      useFactory: (config: Config, pilot: PilotService): SandboxProbe =>
        // Dans les scénarios, pas de Docker : chaque bac à sable démarré d'une session donne la même mesure
        config.testing
          ? new ScriptedSandboxProbe(() =>
              pilot
                .sandboxedSessions()
                .filter((sessionId) => pilot.pilotOf(sessionId)?.sandbox?.state === 'running')
                .map((sessionId) => sandboxKeyOf(sessionId)),
            )
          : new DockerSandboxProbe(),
    },
    {
      provide: CONTAINERS_SERVICE,
      inject: [CONTAINER_EVENTS, PILOT_SERVICE, SESSION_SERVICE, SANDBOX_PROBE],
      useFactory: (events: ContainerEventsBus, pilot: PilotService, sessions: SessionService, probe: SandboxProbe) => {
        const processes = new ProcessTreeProbe();
        const titles = async () => {
          const views = await sessions.listSessions();
          return new Map(views.map((view) => [view.id, view.title ?? `Session ${view.id.slice(0, 8)}`]));
        };
        return new ContainersService({
          clock,
          events,
          hostCpus: availableParallelism(),
          limits: { cpus: AGENT_LIMITS.cpus, memory: AGENT_LIMITS.memory },
          // Un tour piloté sur le poste se mesure sur l'arbre des processus de son agent
          pilots: {
            list: async () => {
              const turns = pilot.runningTurns();
              if (turns.length === 0) return [];
              const pids = turns.flatMap(({ pid }) => (pid === null ? [] : [pid]));
              const [usage, named] = await Promise.all([processes.sample(pids), titles()]);
              return turns.map((turn) => {
                const measured = turn.pid === null ? undefined : usage.get(turn.pid);
                return {
                  cpu: measured?.cpu ?? 0,
                  memory: measured?.memory ?? 0,
                  sessionId: turn.sessionId,
                  since: turn.since,
                  title: named.get(turn.sessionId) ?? `Session ${turn.sessionId.slice(0, 8)}`,
                };
              });
            },
          },
          probe,
          sandboxedSessions: async () => {
            const named = await titles();
            return pilot.sandboxedSessions().map((sessionId) => ({
              key: sandboxKeyOf(sessionId),
              sessionId,
              title: named.get(sessionId) ?? `Session ${sessionId.slice(0, 8)}`,
            }));
          },
        });
      },
    },
  ],
  exports: [ISOLATION_SERVICE, QUOTA_SERVICE, DOCKER_ISOLATION, SANDBOX_PROBE, CONTAINERS_SERVICE],
})
export class IsolationModule implements OnApplicationBootstrap, OnApplicationShutdown {
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(
    @Inject(CONFIG) private readonly config: Config,
    @Inject(ISOLATION_SERVICE) private readonly isolation: IsolationService,
    @Inject(QUOTA_SERVICE) private readonly quota: QuotaService,
    @Inject(CONTAINERS_SERVICE) private readonly containers: ContainersService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.isolation.load();
    await this.quota.load();
    // Conteneurs en cours : mesurés toutes les 5 s, chaque seconde dans les scénarios
    const every = this.config.testing ? SCRIPTED_MEASURE_MS : MEASURE_MS;
    this.timer = setInterval(() => void this.containers.tick().catch(() => undefined), every);
    this.timer.unref();
  }

  onApplicationShutdown(): void {
    clearInterval(this.timer);
  }
}
