import type { QuotaWindows } from '../../shared/domain/subscription-quota.ts';
import type { RepositoryRights } from '../domain/rights.ts';
import type { ServiceLaunch, TestService } from '../domain/test-services.ts';
import type { AgentEvent, AgentRun, AgentRunner, AgentUsage, WorkerHealth, Workspace, Workspaces } from './ports.ts';
import type { TaskService, TaskView } from './task.service.ts';
import { pendingResume } from '../domain/task.ts';

/** Limites de chaque agent (E11a) : mémoire, processeurs et processus. */
export const AGENT_LIMITS = { memory: 4 * 1024 ** 3, cpus: 2, processes: 512 } as const;

/** Mémoire gardée libre sur le poste : une tâche ne part que s'il reste de quoi loger un agent au-delà (E11a). */
export const RESERVED_MEMORY = 4 * 1024 ** 3;

export interface WorkerStatus {
  /** Mémoire qu'un agent réserve en partant, en octets */
  agentMemory: number;
  /** Mémoire libre au-delà de la marge gardée libre, en octets (E6a, E11a) */
  availableMemory: number;
  capacity: number;
  running: number;
  /** null quand le worker est disponible ; sinon pourquoi les tâches attendent (« Worker indisponible ») */
  unavailable: null | string;
  /** Pourquoi une tâche prête reste en file : plus de place, mémoire, dépôt déjà occupé (CA-TACH-06, 07) */
  waiting: Record<number, string>;
}

export interface WorkerDeps {
  /** Lecture de Jira et Confluence par le connecteur Atlassian de claude.ai, activée dans l'isolation (E11b) */
  atlassianRead: () => boolean;
  /** Contexte du dépôt transmis à l'agent au lancement (avec la façon de proposer une décision), et les versions des
   * décisions envoyées (RF-CONT-01) */
  contextOf: (task: TaskView) => Promise<{ text: string; versions: string }>;
  /** Décision proposée par l'agent dans un fichier, en attente de ta validation (RF-CONT-02) */
  propose: (task: TaskView, markdown: string) => Promise<null | number>;
  /** Image de l'agent et services de test du dépôt, lus au lancement (E12a) */
  environmentOf: (task: TaskView) => Promise<{ image: null | string; services: TestService[] }>;
  freeMemory: () => number;
  health: WorkerHealth;
  /** Plafond d'agents en même temps, réglé dans l'isolation du worker (E11a) */
  maxAgents: () => number;
  /** Coût estimé d'un message de l'agent au tarif public (RF-SESS-05), en dollars ; null si le modèle n'a pas de tarif */
  priceOf: (model: null | string, usage: AgentUsage) => null | number;
  rightsOf: (repository: string) => Promise<RepositoryRights>;
  /** Abonnement Claude propre au dépôt (E8a) ; null : celui par défaut */
  claudeProfileOf: (repository: string) => Promise<null | string>;
  /**
   * Quota de l'abonnement (DT-39) : profil Claude d'une tâche, usage lu à chaque tour, et ce qui retient le worker ou
   * arrête un agent
   */
  quota: {
    profileOf: (repositoryProfile: null | string) => string;
    record: (profile: string, windows: QuotaWindows) => Promise<void>;
    stopReason: (profile: string) => null | string;
    waitReason: (profile: string) => null | string;
  };
  runner: AgentRunner;
  /** Dernier lancement des services d'un dépôt, montré dans l'environnement de test ; removed à la fin de la tâche */
  servicesLaunched: (task: TaskView, launches: ServiceLaunch[] | 'removed') => Promise<void>;
  tasks: Pick<TaskService, 'fail' | 'finish' | 'list' | 'progress' | 'record' | 'start'>;
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
export function promptOf(task: TaskView, repositoryContext: null | string = null): string {
  return [
    task.instruction,
    task.context ? `Contexte : ${task.context}` : null,
    repositoryContext,
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
  private status: Pick<WorkerStatus, 'unavailable' | 'waiting'> = { unavailable: null, waiting: {} };
  private ticking = false;

  constructor(private readonly deps: WorkerDeps) {}

  current(): WorkerStatus {
    return {
      ...this.status,
      agentMemory: AGENT_LIMITS.memory,
      availableMemory: Math.max(0, this.deps.freeMemory() - RESERVED_MEMORY),
      capacity: this.deps.maxAgents(),
      running: this.busy(),
    };
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
      this.status = { unavailable, waiting };
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
    // L'abonnement de la tâche au-delà de son seuil d'attente : la place reste à tes sessions (CA-TACH-99)
    const repositoryProfile = await this.deps.claudeProfileOf(task.repository.name);
    const profile = this.deps.quota.profileOf(repositoryProfile);
    return this.deps.quota.waitReason(profile);
  }

  private async run(task: TaskView): Promise<void> {
    if (this.runs.has(task.id)) return;
    const rights = await this.deps.rightsOf(task.repository.name);
    const resume = resumeOf(task);
    const branch = resume?.branch ?? branchOf(task);
    const startBranch = resume ? resume.branch : this.startBranchOf(task);
    let workspace: null | Workspace = null;
    let servicesStarted = false;
    try {
      const place = this.placeOf(task, rights.concurrency);
      await this.deps.tasks.start(
        task.id,
        resume ? `reprise sur ${branch} · ${place}` : `branche ${branch} · ${place}`,
      );
      workspace = await this.deps.workspaces.prepare({
        id: task.id,
        branch,
        keep: resume ? { base: resume.base, from: resume.from } : null,
        repositoryRoot: task.repository.root,
        startBranch,
      });
      // Les droits du dépôt ont pu se resserrer depuis la création : le surplus est écarté (CA-TACH-31)
      const tools = (task.guardrails.tools ?? rights.tools).filter((tool) => rights.tools.includes(tool));
      const environment = await this.deps.environmentOf(task);
      // Une reprise continue la conversation : l'agent a déjà reçu la consigne et le contexte
      const context = resume ? { text: '', versions: '' } : await this.deps.contextOf(task);
      if (context.versions) await this.deps.tasks.record(task.id, 'Contexte transmis', context.versions);
      if (environment.services.length > 0) servicesStarted = true;
      const claudeProfile = await this.deps.claudeProfileOf(task.repository.name);
      const atlassianRead = this.deps.atlassianRead();
      const run = await this.deps.runner.start({
        atlassianRead,
        claudeProfile,
        taskId: task.id,
        workspace,
        folder: task.folder,
        repositoryRoot: task.repository.root,
        image: environment.image,
        deniedTools: rights.deniedTools,
        services: environment.services,
        onServices: (launches) => {
          void this.deps.servicesLaunched(task, launches).catch(() => undefined);
          void this.deps.tasks.record(task.id, ...servicesEntry(launches)).catch(() => undefined);
        },
        prompt: resume ? resume.message : promptOf(task, context.text),
        resume: resume?.sessionId ?? null,
        model: task.guardrails.model ?? rights.model,
        // Les tours d'une reprise s'ajoutent à ceux déjà faits : seuls ceux qui restent sont permis
        maxTurns: Math.min(task.guardrails.maxTurns, rights.maxTurns) - (resume?.turns ?? 0),
        tools,
      });
      this.runs.set(task.id, run);
      await this.follow(
        task,
        run,
        this.deps.quota.profileOf(claudeProfile),
        workspace,
        atlassianRead,
        resume,
      );
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
  private async follow(
    task: TaskView,
    run: AgentRun,
    profile: string,
    workspace: Workspace,
    atlassianRead: boolean,
    resume: null | Resume,
  ): Promise<void> {
    // Une reprise garde la dépense et les tours déjà faits : le budget vaut pour toute la tâche
    const progress = {
      atlassianRead,
      sessionId: resume?.sessionId ?? null,
      spent: resume ? task.spentUsd : 0,
      turns: resume?.turns ?? 0,
    };
    for await (const event of run.events) {
      const done = await this.handle(task, run, profile, workspace, progress, event);
      if (done) return;
    }
    // Plus d'événement sans résultat : l'agent a été arrêté (annulation) ou coupé
    await this.deps.tasks.fail(task.id, 'Interrompue avant la fin');
  }

  private async handle(
    task: TaskView,
    run: AgentRun,
    profile: string,
    workspace: Workspace,
    progress: { atlassianRead: boolean; sessionId: null | string; spent: number; turns: number },
    event: AgentEvent,
  ): Promise<boolean> {
    // Connecteur absent du compte : la tâche continue sans lui (CA-CONT-95)
    if (event.kind === 'connector') {
      if (progress.atlassianRead && !event.available)
        await this.deps.tasks.record(
          task.id,
          'Connecteur Atlassian indisponible',
          'pas branché sur le compte claude.ai de l’abonnement : la tâche continue sans lire Jira ni Confluence',
        );
      return false;
    }
    if (event.kind === 'read') {
      await this.deps.tasks.record(task.id, event.event, event.detail);
      return false;
    }
    if (event.kind === 'session') {
      progress.sessionId = event.sessionId;
      await this.deps.tasks.progress(task.id, progress.spent, { sessionId: event.sessionId, branch: workspace.branch });
      return false;
    }
    // Le coût reste une estimation, sans plafond : c'est le quota de l'abonnement qui arrête l'agent (DT-39)
    if (event.kind === 'usage') {
      progress.spent += this.deps.priceOf(event.model, event.usage) ?? 0;
      await this.deps.tasks.progress(task.id, progress.spent, {});
      return false;
    }
    if (event.kind === 'quota') {
      await this.deps.quota.record(profile, event.windows);
      const reason = this.deps.quota.stopReason(profile);
      if (!reason) return false;
      await run.stop();
      await this.deps.tasks.fail(task.id, reason);
      return true;
    }
    if (!event.ok) {
      await this.deps.tasks.fail(
        task.id,
        event.stop === 'max_turns' ? `Nombre de tours atteint : ${progress.turns + event.turns}` : 'Erreur de l’agent',
      );
      return true;
    }
    const { base, changes, from, proposals } = await this.deps.workspaces.collect(workspace, {
      id: task.id,
      repositoryRoot: task.repository.root,
      title: task.title,
    });
    for (const markdown of proposals) {
      const id = await this.deps.propose(task, markdown).catch(() => null);
      if (id !== null) await this.deps.tasks.record(task.id, 'Décision proposée', `DEC-${id}`);
    }
    await this.deps.tasks.finish(task.id, progress.spent, {
      base,
      branch: workspace.branch,
      changes,
      from,
      report: event.report,
      sessionId: progress.sessionId,
      turns: progress.turns + event.turns,
    });
    return true;
  }

  /** Place prise au départ, notée au journal (CA-TACH-81) : « 1 agent sur 1 pour api-voix, 2 / 4 ». */
  private placeOf(task: TaskView, concurrency: number): string {
    const inRepository = [...this.starting.values()].filter((repository) => repository === task.repository.name).length;
    const repositoryBusy = Math.max(1, inRepository);
    const agents = repositoryBusy > 1 ? 'agents' : 'agent';
    return `${repositoryBusy} ${agents} sur ${concurrency} pour ${task.repository.name}, ${this.busy()} / ${this.deps.maxAgents()}`;
  }

  /** Branche de départ : la sienne pour une relance depuis la branche, celle d'une préalable du même dépôt (RF-TACH-04). */
  private startBranchOf(task: TaskView): null | string {
    const relaunch = task.log.findLast((entry) => entry.event === 'Relancée');
    if (relaunch?.detail === 'depuis sa branche' && task.outcome.branch) return task.outcome.branch;
    const prerequisite = task.waitingFor.find(({ id }) => id === task.startFrom);
    return prerequisite ? branchOf(prerequisite) : null;
  }
}

/** Reprise à la relecture en attente : le message, et ce que la tâche a déjà produit (RF-TACH-10). */
interface Resume {
  base: string;
  branch: string;
  from: string;
  message: string;
  sessionId: string;
  turns: number;
}

function resumeOf(task: TaskView): null | Resume {
  const message = pendingResume(task.log);
  const { base, branch, from, sessionId, turns } = task.outcome;
  if (message === null || !base || !branch || !from || !sessionId) return null;
  return { base, branch, from, message, sessionId, turns };
}

/** « Services prêts » avec le temps de démarrage de chacun, ou ceux qui ne l'ont pas été (CA-TACH-81, CA-CONT-53). */
export function servicesEntry(launches: readonly ServiceLaunch[]): [string, string] {
  const failed = launches.filter((launch) => launch.error);
  if (failed.length > 0)
    return ['Services en échec', failed.map((launch) => `${launch.name} : ${launch.error ?? ''}`).join(' · ')];
  return ['Services prêts', launches.map((launch) => `${launch.name} en ${launch.readySeconds ?? 0} s`).join(' · ')];
}
