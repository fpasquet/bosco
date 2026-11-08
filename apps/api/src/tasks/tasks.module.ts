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
import { TaskService } from './application/task.service.ts';
import { WorkerService } from './application/worker.service.ts';
import { DEFAULT_RIGHTS } from './domain/rights.ts';
import { MikroOrmTaskRepository } from './infrastructure/persistence/task.repository.ts';
import { TaskEventsBus } from './infrastructure/task-events.bus.ts';
import { DockerAgentRunner } from './infrastructure/worker/docker-agent-runner.ts';
import { GitWorkspaces } from './infrastructure/worker/git-workspaces.ts';
import { ScriptedAgentRunner, scriptedWorkspaces } from './infrastructure/worker/scripted-agent.ts';
import { TasksController } from './interface/http/tasks.controller.ts';
import { WorkerController } from './interface/http/worker.controller.ts';
import { AGENT_RUNNER, REPOSITORY_CATALOG, TASK_EVENTS, TASK_SERVICE, WORKER_SERVICE } from './tokens.ts';

const clock = { now: () => new Date() };

/** Le worker repasse à cet intervalle, et à chaque changement de tâche (E5c : il revérifie seul). */
const TICK_MS = 5000;

const rights = { rightsOf: () => Promise.resolve(DEFAULT_RIGHTS) };

/** Contexte des tâches (RF-TACH) ; les dépôts viennent des sessions, par le point de composition. */
@Module({
  imports: [SessionsModule],
  controllers: [TasksController, WorkerController],
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
      provide: AGENT_RUNNER,
      inject: [CONFIG],
      useFactory: (config: Config) => {
        if (config.testing) return new ScriptedAgentRunner();
        const { gid, uid } = userInfo();
        return new DockerAgentRunner({
          ...config.worker,
          profile: join(config.dataDir, 'worker'),
          user: `${uid}:${gid}`,
        });
      },
    },
    {
      provide: WORKER_SERVICE,
      inject: [CONFIG, TASK_SERVICE, AGENT_RUNNER],
      useFactory: (config: Config, tasks: TaskService, runner: DockerAgentRunner | ScriptedAgentRunner) =>
        new WorkerService({
          tasks,
          runner,
          health: runner,
          freeMemory: freemem,
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
  exports: [TASK_SERVICE, WORKER_SERVICE, AGENT_RUNNER],
})
export class TasksModule implements OnApplicationBootstrap, OnApplicationShutdown {
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(
    @Inject(WORKER_SERVICE) private readonly worker: WorkerService,
    @Inject(TASK_EVENTS) private readonly bus: TaskEventsBus,
    @Inject(AGENT_RUNNER) private readonly runner: DockerAgentRunner | ScriptedAgentRunner,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
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
