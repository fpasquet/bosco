import type { MikroORM } from '@mikro-orm/sqlite';
import { Inject, Module, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { freemem, userInfo } from 'node:os';
import { join } from 'node:path';
import type { Config } from '../config.ts';
import type { ContextService } from '../context/application/context.service.ts';
import type { LinksService } from '../context/application/links.service.ts';
import type { SessionService } from '../sessions/application/session.service.ts';
import type { SourceService } from '../sessions/application/source.service.ts';
import type { RepositoryCatalog } from './application/ports.ts';
import { ContextModule } from '../context/context.module.ts';
import { parseProposal, PROPOSAL_HELP } from '../context/domain/proposal.ts';
import { CONTEXT_SERVICE, LINKS_SERVICE } from '../context/tokens.ts';
import { estimateCostMicros } from '../sessions/domain/model-pricing.ts';
import { TokenUsage } from '../sessions/domain/token-usage.ts';
import { SessionsModule } from '../sessions/sessions.module.ts';
import { SESSION_SERVICE, SOURCE_SERVICE } from '../sessions/tokens.ts';
import { CONFIG, ORM } from '../shared/tokens.ts';
import { IsolationService } from './application/isolation.service.ts';
import { ReviewService } from './application/review.service.ts';
import { RightsService } from './application/rights.service.ts';
import { TaskService, type TaskView } from './application/task.service.ts';
import { TestEnvironmentService } from './application/test-environment.service.ts';
import { WorkerService } from './application/worker.service.ts';
import { AllowListFile } from './infrastructure/isolation/allow-list-file.ts';
import { MikroOrmIsolationStore } from './infrastructure/persistence/isolation.store.ts';
import { MikroOrmRightsStore } from './infrastructure/persistence/rights.store.ts';
import { MikroOrmTaskRepository } from './infrastructure/persistence/task.repository.ts';
import { MikroOrmTestEnvironmentStore } from './infrastructure/persistence/test-environment.store.ts';
import { GhPublisher, GitChanges, scriptedReview } from './infrastructure/review/git-review.ts';
import { TaskEventsBus } from './infrastructure/task-events.bus.ts';
import { FileComposeSource, GitComposeSource, servicesFile } from './infrastructure/test-services/compose-file.ts';
import { DockerAgentRunner } from './infrastructure/worker/docker-agent-runner.ts';
import { GitWorkspaces } from './infrastructure/worker/git-workspaces.ts';
import { ScriptedAgentRunner, scriptedWorkspaces } from './infrastructure/worker/scripted-agent.ts';
import { IsolationController } from './interface/http/isolation.controller.ts';
import { ReviewController } from './interface/http/review.controller.ts';
import { RightsController } from './interface/http/rights.controller.ts';
import { TasksController } from './interface/http/tasks.controller.ts';
import { TestEnvironmentController } from './interface/http/test-environment.controller.ts';
import { WorkerController } from './interface/http/worker.controller.ts';
import { McpController } from './interface/mcp/mcp.controller.ts';
import {
  AGENT_RUNNER,
  ISOLATION_SERVICE,
  REPOSITORY_CATALOG,
  REVIEW_SERVICE,
  RIGHTS_SERVICE,
  TASK_EVENTS,
  TASK_SERVICE,
  TEST_ENVIRONMENT_SERVICE,
  WORKER_SERVICE,
} from './tokens.ts';

const clock = { now: () => new Date() };

/** Le worker repasse à cet intervalle, et à chaque changement de tâche (E5c : il revérifie seul). */
const TICK_MS = 5000;

/** Contexte des tâches (RF-TACH) ; les dépôts viennent des sessions, par le point de composition. */
@Module({
  imports: [SessionsModule, ContextModule],
  controllers: [
    TasksController,
    WorkerController,
    IsolationController,
    TestEnvironmentController,
    RightsController,
    ReviewController,
    McpController,
  ],
  providers: [
    { provide: TASK_EVENTS, useValue: new TaskEventsBus() },
    {
      provide: REPOSITORY_CATALOG,
      inject: [SESSION_SERVICE],
      useFactory: (sessions: SessionService): RepositoryCatalog => ({ list: () => sessions.knownRepositories() }),
    },
    {
      provide: RIGHTS_SERVICE,
      inject: [ORM],
      useFactory: (orm: MikroORM) => new RightsService(new MikroOrmRightsStore(orm)),
    },
    {
      provide: TASK_SERVICE,
      inject: [ORM, REPOSITORY_CATALOG, TASK_EVENTS, RIGHTS_SERVICE],
      useFactory: (orm: MikroORM, catalog: RepositoryCatalog, bus: TaskEventsBus, rights: RightsService) =>
        new TaskService(new MikroOrmTaskRepository(orm), catalog, rights, bus, clock),
    },
    {
      provide: REVIEW_SERVICE,
      inject: [CONFIG, TASK_SERVICE, RIGHTS_SERVICE],
      useFactory: (config: Config, tasks: TaskService, rights: RightsService) =>
        config.testing
          ? new ReviewService(tasks, scriptedReview, scriptedReview, rights)
          : new ReviewService(tasks, new GitChanges(), new GhPublisher(config.worker.gh), rights),
    },
    {
      provide: TEST_ENVIRONMENT_SERVICE,
      inject: [CONFIG, ORM, REPOSITORY_CATALOG],
      useFactory: (config: Config, orm: MikroORM, catalog: RepositoryCatalog) =>
        new TestEnvironmentService(
          new MikroOrmTestEnvironmentStore(orm),
          servicesFile(config.testing ? new FileComposeSource() : new GitComposeSource()),
          catalog,
          clock,
        ),
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
      inject: [CONFIG, ISOLATION_SERVICE, SOURCE_SERVICE],
      useFactory: (config: Config, isolation: IsolationService, sources: SourceService) => {
        const profile = join(config.dataDir, 'worker');
        // Le profil du worker devient une source dès qu'il garde une session (E2c, E2d)
        const onSessionSaved = () => void sources.ensureSource(profile).catch(() => undefined);
        if (config.testing) return new ScriptedAgentRunner({ path: profile, onSessionSaved });
        const { gid, uid } = userInfo();
        return new DockerAgentRunner({
          ...config.worker,
          allowDir: join(config.dataDir, 'worker', 'egress'),
          onRefusal: (refusal) => void isolation.refused(refusal).catch(() => undefined),
          onSessionSaved,
          profile,
          user: `${uid}:${gid}`,
        });
      },
    },
    {
      provide: WORKER_SERVICE,
      inject: [
        CONFIG,
        TASK_SERVICE,
        AGENT_RUNNER,
        ISOLATION_SERVICE,
        TEST_ENVIRONMENT_SERVICE,
        RIGHTS_SERVICE,
        CONTEXT_SERVICE,
        LINKS_SERVICE,
      ],
      useFactory: (
        config: Config,
        tasks: TaskService,
        runner: DockerAgentRunner | ScriptedAgentRunner,
        isolation: IsolationService,
        environments: TestEnvironmentService,
        rights: RightsService,
        context: ContextService,
        links: LinksService,
      ) =>
        new WorkerService({
          contextOf: async (task) => {
            const taskLinks = await links.contextLinks(task.id);
            const sent = await context.sentTo(task.repository.name, taskLinks);
            return { text: `${sent.text}\n\n${PROPOSAL_HELP}`, versions: sent.versions };
          },
          propose: async (task, markdown) => {
            const text = parseProposal(markdown);
            if (!text) return null;
            const decision = await context.propose(task.repository.name, text, task.id);
            return decision.id;
          },
          environmentOf: (task) => environments.forTask(task.repository),
          servicesLaunched: (task, launches) => environments.launched(task.repository.name, task.id, launches),
          tasks,
          runner,
          health: runner,
          freeMemory: freemem,
          maxAgents: () => isolation.maxAgents(),
          rightsOf: (repository) => rights.rightsOf(repository),
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
  exports: [TASK_SERVICE, WORKER_SERVICE, AGENT_RUNNER, ISOLATION_SERVICE, RIGHTS_SERVICE],
})
export class TasksModule implements OnApplicationBootstrap, OnApplicationShutdown {
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(
    @Inject(WORKER_SERVICE) private readonly worker: WorkerService,
    @Inject(TASK_EVENTS) private readonly bus: TaskEventsBus,
    @Inject(AGENT_RUNNER) private readonly runner: DockerAgentRunner | ScriptedAgentRunner,
    @Inject(ISOLATION_SERVICE) private readonly isolation: IsolationService,
    @Inject(TASK_SERVICE) private readonly tasks: TaskService,
    @Inject(SESSION_SERVICE) private readonly sessions: SessionService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.isolation.load();
    // La session d'un agent suit l'état de sa tâche : À relire, En échec (E2c, E2d)
    const link = (task: TaskView) =>
      task.mode === 'worker' && task.outcome.sessionId
        ? this.sessions.linkTask(task.outcome.sessionId, {
            id: task.id,
            state: task.state,
            failure: task.failure,
            title: task.title,
          })
        : Promise.resolve();
    for (const task of await this.tasks.list()) await link(task);
    this.bus.changes.subscribe((task) => void link(task).catch(() => undefined));
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
