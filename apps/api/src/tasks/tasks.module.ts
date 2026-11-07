import type { MikroORM } from '@mikro-orm/sqlite';
import { Inject, Module, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { freemem, userInfo } from 'node:os';
import { join } from 'node:path';
import type { Config } from '../config.ts';
import type { SessionService } from '../sessions/application/session.service.ts';
import type { RepositoryCatalog } from './application/ports.ts';
import { estimateCostMicros } from '../sessions/domain/model-pricing.ts';
import { TokenUsage } from '../sessions/domain/token-usage.ts';
import { SessionsModule } from '../sessions/sessions.module.ts';
import { SESSION_SERVICE } from '../sessions/tokens.ts';
import { CONFIG, ORM } from '../shared/tokens.ts';
import { IsolationService } from './application/isolation.service.ts';
import { TaskService } from './application/task.service.ts';
import { WorkerService } from './application/worker.service.ts';
import { DEFAULT_RIGHTS } from './domain/rights.ts';
import { AllowListFile } from './infrastructure/isolation/allow-list-file.ts';
import { MikroOrmIsolationStore } from './infrastructure/persistence/isolation.store.ts';
import { MikroOrmTaskRepository } from './infrastructure/persistence/task.repository.ts';
import { TaskEventsBus } from './infrastructure/task-events.bus.ts';
import { DockerAgentRunner } from './infrastructure/worker/docker-agent-runner.ts';
import { GitWorkspaces } from './infrastructure/worker/git-workspaces.ts';
import { ScriptedAgentRunner, scriptedWorkspaces } from './infrastructure/worker/scripted-agent.ts';
import { IsolationController } from './interface/http/isolation.controller.ts';
import { TasksController } from './interface/http/tasks.controller.ts';
import { WorkerController } from './interface/http/worker.controller.ts';
import {
  AGENT_RUNNER,
  ISOLATION_SERVICE,
  REPOSITORY_CATALOG,
  TASK_EVENTS,
  TASK_SERVICE,
  WORKER_SERVICE,
} from './tokens.ts';

const clock = { now: () => new Date() };

/** Le worker repasse à cet intervalle, et à chaque changement de tâche (E5c : il revérifie seul). */
const TICK_MS = 5000;

const rights = { rightsOf: () => Promise.resolve(DEFAULT_RIGHTS) };

/** Contexte des tâches (RF-TACH) ; les dépôts viennent des sessions, par le point de composition. */
@Module({
  imports: [SessionsModule],
  controllers: [TasksController, WorkerController, IsolationController],
  providers: [
    { provide: TASK_EVENTS, useValue: new TaskEventsBus() },
    {
      provide: REPOSITORY_CATALOG,
      inject: [SESSION_SERVICE],
      useFactory: (sessions: SessionService): RepositoryCatalog => ({
        list: async () => {
          const views = await sessions.listSessions();
          const roots = new Map<string, string>();
          for (const view of views) if (view.repository) roots.set(view.repository.root, view.repository.name);
          return [...roots.entries()]
            .map(([root, name]) => ({ name, root }))
            .toSorted((a, b) => a.name.localeCompare(b.name, 'fr'));
        },
      }),
    },
    {
      provide: TASK_SERVICE,
      inject: [ORM, REPOSITORY_CATALOG, TASK_EVENTS],
      useFactory: (orm: MikroORM, catalog: RepositoryCatalog, bus: TaskEventsBus) =>
        new TaskService(new MikroOrmTaskRepository(orm), catalog, rights, bus, clock),
    },
    {
      provide: ISOLATION_SERVICE,
      inject: [CONFIG, ORM],
      useFactory: (config: Config, orm: MikroORM) =>
        new IsolationService(
          new MikroOrmIsolationStore(orm),
          new AllowListFile(join(config.dataDir, 'worker', 'egress')),
        ),
    },
    {
      provide: AGENT_RUNNER,
      inject: [CONFIG, ISOLATION_SERVICE],
      useFactory: (config: Config, isolation: IsolationService) => {
        if (config.testing) return new ScriptedAgentRunner();
        const { gid, uid } = userInfo();
        return new DockerAgentRunner({
          ...config.worker,
          allowDir: join(config.dataDir, 'worker', 'egress'),
          onRefusal: (refusal) => void isolation.refused(refusal).catch(() => undefined),
          profile: join(config.dataDir, 'worker'),
          user: `${uid}:${gid}`,
        });
      },
    },
    {
      provide: WORKER_SERVICE,
      inject: [CONFIG, TASK_SERVICE, AGENT_RUNNER, ISOLATION_SERVICE],
      useFactory: (
        config: Config,
        tasks: TaskService,
        runner: DockerAgentRunner | ScriptedAgentRunner,
        isolation: IsolationService,
      ) =>
        new WorkerService({
          tasks,
          runner,
          health: runner,
          freeMemory: freemem,
          maxAgents: () => isolation.maxAgents(),
          rightsOf: rights.rightsOf,
          workspaces: config.testing ? scriptedWorkspaces : new GitWorkspaces(join(config.dataDir, 'workspaces')),
          priceOf: (model, usage) => {
            const micros = estimateCostMicros(
              model,
              new TokenUsage(usage.input, usage.output, usage.cacheCreation, usage.cacheRead),
            );
            return micros === null ? null : micros / 1_000_000;
          },
        }),
    },
  ],
  exports: [TASK_SERVICE, WORKER_SERVICE, AGENT_RUNNER, ISOLATION_SERVICE],
})
export class TasksModule implements OnApplicationBootstrap, OnApplicationShutdown {
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(
    @Inject(WORKER_SERVICE) private readonly worker: WorkerService,
    @Inject(TASK_EVENTS) private readonly bus: TaskEventsBus,
    @Inject(AGENT_RUNNER) private readonly runner: DockerAgentRunner | ScriptedAgentRunner,
    @Inject(ISOLATION_SERVICE) private readonly isolation: IsolationService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.isolation.load();
    if (this.runner instanceof DockerAgentRunner) await this.runner.cleanup();
    await this.worker.recover();
    this.timer = setInterval(() => void this.worker.tick(), TICK_MS);
    this.timer.unref();
    // Une tâche devenue prête part sans attendre le prochain passage
    this.bus.changes.subscribe((task) => {
      if (task.state === 'queued') void this.worker.tick();
    });
  }

  onApplicationShutdown(): void {
    clearInterval(this.timer);
  }
}
