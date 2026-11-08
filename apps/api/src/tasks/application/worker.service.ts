import type { RepositoryRights } from '../domain/rights.ts';
import type { ServiceLaunch, TestService } from '../domain/test-services.ts';
import type { AgentEvent, AgentRun, AgentRunner, AgentUsage, WorkerHealth, Workspace, Workspaces } from './ports.ts';
import type { TaskService, TaskView } from './task.service.ts';

/** Limites de chaque agent (E11a) : mémoire, processeurs et processus. */
export const AGENT_LIMITS = { memory: 4 * 1024 ** 3, cpus: 2, processes: 512 } as const;

/** Mémoire gardée libre sur le poste : une tâche ne part que s'il reste de quoi loger un agent au-delà (E11a). */
export const RESERVED_MEMORY = 4 * 1024 ** 3;

export interface WorkerStatus {
  capacity: number;
  running: number;
  /** null quand le worker est disponible ; sinon pourquoi les tâches attendent (« Worker indisponible ») */
  unavailable: null | string;
  /** Pourquoi une tâche prête reste en file : plus de place, mémoire, dépôt déjà occupé (CA-TACH-06, 07) */
  waiting: Record<number, string>;
}

export interface WorkerDeps {
  /** Image de l'agent et services de test du dépôt, lus au lancement (E12a) */
  environmentOf: (task: TaskView) => Promise<{ image: null | string; services: TestService[] }>;
  freeMemory: () => number;
  health: WorkerHealth;
  /** Plafond d'agents en même temps, réglé dans l'isolation du worker (E11a) */
  maxAgents: () => number;
  /** Coût estimé d'un message de l'agent au tarif public (RF-SESS-05), en dollars ; null si le modèle n'a pas de tarif */
  priceOf: (model: null | string, usage: AgentUsage) => null | number;
  rightsOf: (repository: string) => Promise<RepositoryRights>;
  runner: AgentRunner;
  /** Dernier lancement des services d'un dépôt, montré dans l'environnement de test ; removed à la fin de la tâche */
  servicesLaunched: (task: TaskView, launches: ServiceLaunch[] | 'removed') => Promise<void>;
  tasks: Pick<TaskService, 'fail' | 'finish' | 'list' | 'progress' | 'start'>;
  workspaces: Workspaces;
}

/** « bosco/t-12-prononciation-sncf » */
export function branchOf(task: Pick<TaskView, 'id' | 'title'>): string {
  const slug = task.title
    .normalize('NFD')
    .replaceAll(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '')
    .slice(0, 40)
    .replace(/-$/, '');
  return `bosco/t-${task.id}-${slug}`;
}

/** Consigne transmise à l'agent : la tâche, son contexte, et ce qu'on attend de son compte rendu (CA-TACH-25). */
export function promptOf(task: TaskView): string {
  return [
    task.instruction,
    task.context ? `Contexte : ${task.context}` : null,
    'Tu travailles seul, sans terminal, dans une copie jetable du dépôt. Ne pousse rien et ne fusionne rien.',
    'Termine par un compte rendu court : ce qui est fait, et ce qu’il reste à vérifier.',
  ]
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Worker (RF-TACH-05, RF-CONT-06) : lance les tâches prêtes tant qu'il reste une place et assez de mémoire, fait
 * travailler l'agent dans une copie jetable du dépôt, arrête l'agent au budget, puis rapatrie la branche.
 */
export class WorkerService {
  private readonly runs = new Map<number, AgentRun>();
  /** Tâches lancées dans ce passage, dont l'agent n'a pas encore démarré : leur place est déjà prise */
  private readonly starting = new Map<number, string>();
  private status: WorkerStatus = { capacity: 0, running: 0, unavailable: null, waiting: {} };
  private ticking = false;

  constructor(private readonly deps: WorkerDeps) {}

  current(): WorkerStatus {
    return { ...this.status, capacity: this.deps.maxAgents(), running: this.busy() };
  }

  private busy(): number {
    return new Set([...this.runs.keys(), ...this.starting.keys()]).size;
  }

  /** Au démarrage : les restes d'un arrêt brutal sont supprimés, les tâches restées en cours échouent (NF-12). */
  async recover(): Promise<void> {
    await this.deps.workspaces.cleanupAll();
    const tasks = await this.deps.tasks.list();
    for (const task of tasks.filter((candidate) => candidate.state === 'running' && candidate.mode === 'worker'))
      await this.deps.tasks.fail(task.id, 'Session coupée : Bosco s’est arrêté pendant la tâche');
  }

  /** Un passage : lance ce qui peut partir, et note pourquoi le reste attend. */
  async tick(): Promise<WorkerStatus> {
    if (this.ticking) return this.current();
    this.ticking = true;
    try {
      const unavailable = await this.deps.health.check();
      const tasks = await this.deps.tasks.list();
      const queued = tasks
        .filter((task) => task.state === 'queued' && task.mode === 'worker')
        .toSorted((a, b) => a.id - b.id);
      const waiting: Record<number, string> = {};
      for (const task of queued) {
        const reason = unavailable ? 'Worker indisponible' : await this.blocker(task, tasks);
        if (reason) waiting[task.id] = reason;
        else {
          this.starting.set(task.id, task.repository.name);
          void this.run(task);
        }
      }
      this.status = { capacity: this.deps.maxAgents(), running: this.busy(), unavailable, waiting };
      return this.current();
    } finally {
      this.ticking = false;
    }
  }

  /** Arrêt de l'agent d'une tâche annulée : il s'arrête en quelques secondes, la branche reste (RF-TACH-07). */
  async stop(taskId: number): Promise<void> {
    await this.runs.get(taskId)?.stop();
  }

  private async blocker(task: TaskView, tasks: TaskView[]): Promise<null | string> {
    const agents = this.deps.maxAgents();
    if (this.busy() >= agents) return `Plus de place : ${agents} ${agents > 1 ? 'agents' : 'agent'} au travail`;
    if (this.deps.freeMemory() - RESERVED_MEMORY < AGENT_LIMITS.memory) return 'Mémoire libre insuffisante';
    const rights = await this.deps.rightsOf(task.repository.name);
    const running = tasks.filter(
      (other) => other.repository.name === task.repository.name && other.state === 'running',
    );
    const starting = [...this.starting.entries()].filter(
      ([id, repository]) => repository === task.repository.name && !running.some((other) => other.id === id),
    );
    const busy = running.length + starting.length;
    if (busy >= rights.concurrency) return `${task.repository.name} : ${rights.concurrency} agent au plus à la fois`;
    return null;
  }

  private async run(task: TaskView): Promise<void> {
    if (this.runs.has(task.id)) return;
    const rights = await this.deps.rightsOf(task.repository.name);
    const branch = branchOf(task);
    const startBranch = this.startBranchOf(task);
    let workspace: null | Workspace = null;
    let servicesStarted = false;
    try {
      await this.deps.tasks.start(task.id, `branche ${branch}`);
      workspace = await this.deps.workspaces.prepare({
        id: task.id,
        branch,
        repositoryRoot: task.repository.root,
        startBranch,
      });
      // Les droits du dépôt ont pu se resserrer depuis la création : le surplus est écarté (CA-TACH-31)
      const tools = (task.guardrails.tools ?? rights.tools).filter((tool) => rights.tools.includes(tool));
      const environment = await this.deps.environmentOf(task);
      if (environment.services.length > 0) servicesStarted = true;
      const run = await this.deps.runner.start({
        taskId: task.id,
        workspace,
        folder: task.folder,
        repositoryRoot: task.repository.root,
        image: environment.image,
        deniedTools: rights.deniedTools,
        services: environment.services,
        onServices: (launches) => void this.deps.servicesLaunched(task, launches).catch(() => undefined),
        prompt: promptOf(task),
        model: task.guardrails.model ?? rights.model,
        maxTurns: Math.min(task.guardrails.maxTurns, rights.maxTurns),
        tools,
      });
      this.runs.set(task.id, run);
      await this.follow(task, run, Math.min(task.guardrails.budgetUsd, rights.maxBudgetUsd), workspace);
    } catch (error) {
      // Une tâche annulée ou effacée pendant son lancement n'a plus d'état à recevoir
      await this.deps.tasks
        .fail(task.id, `Erreur de l’agent : ${error instanceof Error ? error.message : String(error)}`)
        .catch(() => undefined);
    } finally {
      await this.runs.get(task.id)?.finished();
      this.runs.delete(task.id);
      this.starting.delete(task.id);
      if (workspace) await this.deps.workspaces.remove(workspace);
      if (servicesStarted) await this.deps.servicesLaunched(task, 'removed').catch(() => undefined);
      void this.tick();
    }
  }

  /** Suit l'agent jusqu'à sa fin et donne à la tâche son état final. */
  private async follow(task: TaskView, run: AgentRun, budgetUsd: number, workspace: Workspace): Promise<void> {
    const progress = { sessionId: null as null | string, spent: 0 };
    for await (const event of run.events) {
      const done = await this.handle(task, run, budgetUsd, workspace, progress, event);
      if (done) return;
    }
    // Plus d'événement sans résultat : l'agent a été arrêté (annulation) ou coupé
    await this.deps.tasks.fail(task.id, 'Interrompue avant la fin');
  }

  private async handle(
    task: TaskView,
    run: AgentRun,
    budgetUsd: number,
    workspace: Workspace,
    progress: { sessionId: null | string; spent: number },
    event: AgentEvent,
  ): Promise<boolean> {
    if (event.kind === 'session') {
      progress.sessionId = event.sessionId;
      await this.deps.tasks.progress(task.id, progress.spent, { sessionId: event.sessionId, branch: workspace.branch });
      return false;
    }
    if (event.kind === 'usage') {
      progress.spent += this.deps.priceOf(event.model, event.usage) ?? 0;
      await this.deps.tasks.progress(task.id, progress.spent, {});
      if (progress.spent <= budgetUsd) return false;
      await run.stop();
      await this.deps.tasks.fail(task.id, `Budget atteint : ${usd(progress.spent)} sur ${usd(budgetUsd)}`);
      return true;
    }
    if (!event.ok) {
      await this.deps.tasks.fail(
        task.id,
        event.stop === 'max_turns' ? `Nombre de tours atteint : ${event.turns}` : 'Erreur de l’agent',
      );
      return true;
    }
    const { base, changes, from } = await this.deps.workspaces.collect(workspace, {
      id: task.id,
      repositoryRoot: task.repository.root,
      title: task.title,
    });
    await this.deps.tasks.finish(task.id, progress.spent, {
      base,
      branch: workspace.branch,
      changes,
      from,
      report: event.report,
      sessionId: progress.sessionId,
      turns: event.turns,
    });
    return true;
  }

  /** Branche de départ : la sienne pour une relance depuis la branche, celle d'une préalable du même dépôt (RF-TACH-04). */
  private startBranchOf(task: TaskView): null | string {
    const relaunch = task.log.findLast((entry) => entry.event === 'Relancée');
    if (relaunch?.detail === 'depuis sa branche' && task.outcome.branch) return task.outcome.branch;
    const prerequisite = task.waitingFor.find(({ id }) => id === task.startFrom);
    return prerequisite ? branchOf(prerequisite) : null;
  }
}

function usd(value: number): string {
  return `${value.toFixed(2).replace('.', ',')} $`;
}
