import type { RepositoryRights } from '../domain/rights.ts';
import type { Clock, RepositoryCatalog, RightsReader, TaskEvents, TaskRepository } from './ports.ts';
import { DomainError } from '../../shared/domain/domain-error.ts';
import { TaskBoard } from '../domain/task-board.ts';
import {
  type Guardrails,
  NOT_STARTED,
  Task,
  type TaskMode,
  type TaskOutcome,
  type TaskSnapshot,
  titleOf,
} from '../domain/task.ts';

export interface TaskDraft {
  context: null | string;
  folder: string;
  guardrails: Guardrails;
  instruction: string;
  mode: TaskMode;
  prerequisites: number[];
  repository: string;
}

export interface TaskIssue {
  /** Champ du formulaire en cause, pour y placer le focus (E6b) */
  field: 'budgetUsd' | 'instruction' | 'maxTurns' | 'prerequisites' | 'repository' | 'tools';
  message: string;
}

/** Le formulaire contient des erreurs : chaque message dit quoi corriger (E6b). */
export class InvalidTask extends DomainError {
  constructor(readonly issues: TaskIssue[]) {
    super('invalidTask', issues.map((issue) => issue.message).join(' '));
  }
}

export class UnknownTask extends DomainError {
  constructor(id: number) {
    super('unknownTask', `No task T-${id}`);
  }
}

export interface TaskView extends TaskSnapshot {
  /** La tâche se modifie encore : elle n'a pas démarré (RF-TACH-08) */
  editable: boolean;
  /** Branche de départ : celle d'une préalable du même dépôt, sinon la branche principale (RF-TACH-04) */
  startFrom: null | number;
  title: string;
  /** Préalables, avec leur titre et leur état */
  waitingFor: { id: number; state: TaskSnapshot['state']; title: string }[];
}

function usd(value: number): string {
  return `${value.toFixed(2).replace('.', ',')} $`;
}

function guardrailIssues(draft: TaskDraft, rights: RepositoryRights): TaskIssue[] {
  const { budgetUsd, maxTurns, tools } = draft.guardrails;
  const issues: TaskIssue[] = [];
  if (budgetUsd <= 0 || budgetUsd > rights.maxBudgetUsd)
    issues.push({
      field: 'budgetUsd',
      message: `Le budget dépasse le plafond de ${draft.repository} : ${usd(rights.maxBudgetUsd)} au plus. Baisse-le, ou relève le plafond dans les droits du dépôt.`,
    });
  if (maxTurns <= 0 || maxTurns > rights.maxTurns)
    issues.push({
      field: 'maxTurns',
      message: `Le nombre de tours dépasse le plafond de ${draft.repository} : ${rights.maxTurns} au plus.`,
    });
  const refused = (tools ?? []).filter((tool) => !rights.tools.includes(tool));
  if (refused.length > 0)
    issues.push({
      field: 'tools',
      message: `${refused.join(', ')} n’est pas autorisé dans ${draft.repository}, qui autorise : ${rights.tools.join(', ')}.`,
    });
  return issues;
}

const PREREQUISITE_MESSAGES: Record<string, (id: string) => string> = {
  cyclicPrerequisite: () => 'Une préalable attend déjà cette tâche.',
  failedPrerequisite: (id) => `T-${id} est en échec : relance-la, ou retire-la des préalables.`,
  unknownPrerequisite: (id) => `T-${id} n’existe pas.`,
};

/** On ne peut pas attendre une tâche inconnue, déjà en échec, ou qui attend celle-ci (RF-TACH-03). */
function prerequisiteIssue(tasks: Task[], prerequisites: number[], self: null | number): null | TaskIssue {
  try {
    new TaskBoard(tasks).checkPrerequisites(prerequisites, self);
    return null;
  } catch (error) {
    if (!(error instanceof DomainError)) throw error;
    const id = /T-(\d+)/.exec(error.message)?.[1] ?? '?';
    const message = PREREQUISITE_MESSAGES[error.code] ?? PREREQUISITE_MESSAGES.unknownPrerequisite;
    return { field: 'prerequisites', message: message?.(id) ?? error.message };
  }
}

/** Cas d'usage des tâches (RF-TACH) : création, modification, annulation et relance, sous les droits du dépôt. */
export class TaskService {
  constructor(
    private readonly tasks: TaskRepository,
    private readonly catalog: RepositoryCatalog,
    private readonly rights: RightsReader,
    private readonly events: TaskEvents,
    private readonly clock: Clock,
  ) {}

  async list(): Promise<TaskView[]> {
    const tasks = await this.tasks.list();
    return tasks.map((task) => this.view(task, tasks));
  }

  async get(id: number): Promise<TaskView> {
    const tasks = await this.tasks.list();
    const task = tasks.find((candidate) => candidate.id === id);
    if (!task) throw new UnknownTask(id);
    return this.view(task, tasks);
  }

  /** Tâches qui échoueraient si celle-ci était annulée : la confirmation les nomme (E13c). */
  async cancellationImpact(id: number): Promise<TaskView[]> {
    const tasks = await this.tasks.list();
    const board = new TaskBoard(tasks);
    return board
      .dependents(id)
      .filter((task) => NOT_STARTED.includes(task.state))
      .map((task) => this.view(task, tasks));
  }

  async create(draft: TaskDraft, createdBy: 'person' | 'session' = 'person'): Promise<TaskView> {
    const tasks = await this.tasks.list();
    const repository = await this.check(draft, tasks, null);
    const task = Task.create({ ...draft, repository, id: await this.tasks.nextId(), createdBy }, this.clock.now());
    return this.commit([...tasks, task], [task], task.id);
  }

  async edit(id: number, draft: TaskDraft): Promise<TaskView> {
    const tasks = await this.tasks.list();
    const task = this.find(tasks, id);
    const repository = await this.check(draft, tasks, id);
    task.edit({ ...draft }, this.clock.now());
    task.toSnapshot();
    if (repository.name !== task.repository)
      throw new InvalidTask([
        { field: 'repository', message: 'Le dépôt d’une tâche ne change pas : crée une autre tâche.' },
      ]);
    return this.commit(tasks, [task], id);
  }

  async cancel(id: number): Promise<TaskView> {
    const tasks = await this.tasks.list();
    const task = this.find(tasks, id);
    const at = this.clock.now();
    task.cancel(at);
    const failed = new TaskBoard(tasks).cascade(id, 'annulée', at);
    return this.commit(tasks, [task, ...failed], id);
  }

  /** Relance d'un échec : la tâche repasse en file avec le même numéro, et celles qui l'attendaient avec elle (E13b). */
  async relaunch(
    id: number,
    changes: { budgetUsd: number; fromBranch: boolean; instruction?: string },
  ): Promise<TaskView> {
    const tasks = await this.tasks.list();
    const task = this.find(tasks, id);
    const snapshot = task.toSnapshot();
    const rights = await this.rights.rightsOf(snapshot.repository.name);
    if (changes.budgetUsd > rights.maxBudgetUsd)
      throw new InvalidTask([
        { field: 'budgetUsd', message: `Le budget dépasse le plafond du dépôt : ${usd(rights.maxBudgetUsd)} au plus.` },
      ]);
    const at = this.clock.now();
    task.relaunch(
      { ...snapshot.guardrails, budgetUsd: changes.budgetUsd },
      at,
      changes.fromBranch ? 'depuis sa branche' : 'de zéro',
    );
    if (changes.instruction?.trim())
      task.edit({ instruction: `${snapshot.instruction}\n\n${changes.instruction.trim()}` }, at);
    const revived = new TaskBoard(tasks).revive(id, at);
    return this.commit(tasks, [task, ...revived], id);
  }

  /** Le worker lance la tâche (RF-TACH-05). */
  async start(id: number, detail: null | string): Promise<TaskView> {
    const tasks = await this.tasks.list();
    const task = this.find(tasks, id);
    task.start(this.clock.now(), detail);
    return this.commit(tasks, [task], id);
  }

  /** Avancement de l'agent : dépense, session, branche, publiés en direct. */
  async progress(id: number, spentUsd: number, outcome: Partial<TaskOutcome>): Promise<TaskView> {
    const tasks = await this.tasks.list();
    const task = this.find(tasks, id);
    if (task.state !== 'running') return this.view(task, tasks);
    task.progress(spentUsd, outcome, this.clock.now());
    return this.commit(tasks, [task], id);
  }

  /** L'agent a fini : la tâche attend ta relecture (E7a) ; une tâche annulée entre-temps le reste. */
  async finish(id: number, spentUsd: number, outcome: Partial<TaskOutcome>): Promise<TaskView> {
    const tasks = await this.tasks.list();
    const task = this.find(tasks, id);
    if (task.state !== 'running') return this.view(task, tasks);
    task.finish(spentUsd, outcome, this.clock.now());
    return this.commit(tasks, [task], id);
  }

  /** Échec d'une tâche en cours : celles qui l'attendent échouent en cascade (RF-TACH-03). */
  async fail(id: number, reason: string): Promise<TaskView> {
    const tasks = await this.tasks.list();
    const task = this.find(tasks, id);
    if (task.state !== 'running') return this.view(task, tasks);
    const at = this.clock.now();
    task.fail(reason, at);
    const failed = new TaskBoard(tasks).cascade(id, 'en échec', at);
    return this.commit(tasks, [task, ...failed], id);
  }

  async validate(id: number): Promise<TaskView> {
    const tasks = await this.tasks.list();
    const task = this.find(tasks, id);
    task.validate(this.clock.now());
    return this.commit(tasks, [task], id);
  }

  async reject(id: number, reason: null | string): Promise<TaskView> {
    const tasks = await this.tasks.list();
    const task = this.find(tasks, id);
    const at = this.clock.now();
    task.reject(reason, at);
    const failed = new TaskBoard(tasks).cascade(id, 'rejetée', at);
    return this.commit(tasks, [task, ...failed], id);
  }

  /** Rejet avec relance (E7b) : le motif rejoint la consigne, la tâche repart de sa branche, les suivantes attendent. */
  async rejectAndRelaunch(id: number, reason: string): Promise<TaskView> {
    const tasks = await this.tasks.list();
    const task = this.find(tasks, id);
    const at = this.clock.now();
    task.reject(reason, at);
    const snapshot = task.toSnapshot();
    task.relaunch(snapshot.guardrails, at, 'depuis sa branche');
    task.edit({ instruction: `${snapshot.instruction}\n\nRelecture : ${reason}` }, at);
    const revived = new TaskBoard(tasks).revive(id, at);
    return this.commit(tasks, [task, ...revived], id);
  }

  /** La PR brouillon ouverte à la validation rejoint la tâche (E7c). */
  async attachPullRequest(id: number, url: string): Promise<TaskView> {
    const tasks = await this.tasks.list();
    const task = this.find(tasks, id);
    const snapshot = task.toSnapshot();
    task.progress(snapshot.spentUsd, { pullRequest: url }, this.clock.now());
    return this.commit(tasks, [task], id);
  }

  /** Enregistre les tâches touchées, recalcule ce qui part ou attend, et publie les changements. */
  private async commit(tasks: Task[], touched: Task[], id: number): Promise<TaskView> {
    const settled = new TaskBoard(tasks).settleAll(this.clock.now());
    const changed = [...new Map([...touched, ...settled].map((task) => [task.id, task])).values()];
    await this.tasks.save(changed);
    this.events.tasksChanged(changed.map((task) => this.view(task, tasks)));
    return this.view(this.find(tasks, id), tasks);
  }

  private find(tasks: readonly Task[], id: number): Task {
    const task = tasks.find((candidate) => candidate.id === id);
    if (!task) throw new UnknownTask(id);
    return task;
  }

  /** Vérifie une tâche contre les droits de son dépôt ; toutes les erreurs à la fois (E6b). */
  private async check(draft: TaskDraft, tasks: Task[], self: null | number): Promise<{ name: string; root: string }> {
    const repositories = await this.catalog.list();
    const repository = repositories.find((candidate) => candidate.name === draft.repository);
    const issues: TaskIssue[] = [];
    if (!repository) issues.push({ field: 'repository', message: 'Choisis un dépôt des sources surveillées.' });
    if (!draft.instruction.trim()) issues.push({ field: 'instruction', message: 'Écris la consigne de la tâche.' });
    // Les garde-fous ne valent que pour le worker : en mode Ma session, ceux de la session s'appliquent (RF-TACH-05)
    if (draft.mode === 'worker') {
      const rights = await this.rights.rightsOf(draft.repository);
      issues.push(...guardrailIssues(draft, rights));
    }
    const prerequisite = prerequisiteIssue(tasks, draft.prerequisites, self);
    if (prerequisite) issues.push(prerequisite);
    if (issues.length > 0 || !repository) throw new InvalidTask(issues);
    return repository;
  }

  private view(task: Task, tasks: readonly Task[]): TaskView {
    const snapshot = task.toSnapshot();
    const waitingFor = snapshot.prerequisites.flatMap((id) => {
      const prerequisite = tasks.find((candidate) => candidate.id === id)?.toSnapshot();
      return prerequisite ? [{ id, state: prerequisite.state, title: titleOf(prerequisite.instruction) }] : [];
    });
    // Une seule préalable du même dépôt : la tâche part de sa branche (RF-TACH-04)
    const sameRepository = waitingFor.filter(
      ({ id }) => tasks.find((candidate) => candidate.id === id)?.repository === snapshot.repository.name,
    );
    return {
      ...snapshot,
      title: titleOf(snapshot.instruction),
      editable: NOT_STARTED.includes(snapshot.state),
      waitingFor,
      startFrom: sameRepository.length === 1 ? (sameRepository[0]?.id ?? null) : null,
    };
  }
}
