import type { RightsReader } from './ports.ts';
import type { TaskService, TaskView } from './task.service.ts';
import { DomainError } from '../../shared/domain/domain-error.ts';

/** Fichier modifié par la tâche, depuis le point de départ de sa branche. */
export interface FileChange {
  added: number;
  path: string;
  removed: number;
}

export interface TaskChanges {
  /** Diff unifié, coupé au-delà d'une taille raisonnable */
  diff: string;
  files: FileChange[];
  truncated: boolean;
}

/** Diff d'une branche dans le dépôt de la personne. */
export interface ChangesReader {
  commits(root: string, base: string, branch: string): Promise<number>;
  of(root: string, base: string, branch: string): Promise<TaskChanges>;
}

/** Pousse une branche et ouvre une PR en brouillon, avec git et GitHub CLI du poste (E7c). */
export interface PullRequestPublisher {
  /** null si l'envoi est possible ; sinon pourquoi seule « Valider sans pousser » reste proposée */
  /** null si la branche peut partir avec ce compte (null : le compte actif de gh), sinon pourquoi */
  availability(root: string, account: null | string): Promise<null | string>;
  publish(
    root: string,
    request: { body: string; branch: string; from: string; title: string },
    account: null | string,
  ): Promise<string>;
}

export class ReviewError extends DomainError {
  constructor(message: string) {
    super('review_error', message);
  }
}

export interface ReviewInfo {
  /** null si Bosco peut pousser ; sinon la raison */
  blocked: null | string;
  commits: number;
  pullRequest: 'always' | 'ask' | 'never';
}

export interface Validation {
  /** Cause d'un envoi en échec : la tâche reste validée (E7c, annotation 4) */
  pullRequestError: null | string;
  task: TaskView;
}

/** Corps de la PR proposé : le compte rendu de l'agent et la tâche. */
export function pullRequestBody(task: TaskView): string {
  return [task.outcome.report?.trim(), `Tâche T-${task.id}`].filter(Boolean).join('\n\n');
}

/** Relecture d'une tâche du worker (E7a, E7b, E7c) : diff, validation avec ou sans PR, rejet avec ou sans relance. */
export class ReviewService {
  constructor(
    private readonly tasks: Pick<
      TaskService,
      'attachPullRequest' | 'get' | 'reject' | 'rejectAndRelaunch' | 'validate'
    >,
    private readonly changes: ChangesReader,
    private readonly publisher: PullRequestPublisher,
    private readonly rights: RightsReader,
    /** Compte GitHub du dépôt (E8a) ; null : le compte actif de gh */
    private readonly githubAccountOf: (repository: string) => Promise<null | string> = () => Promise.resolve(null),
  ) {}

  async changesOf(id: number): Promise<TaskChanges> {
    const task = await this.tasks.get(id);
    const { base, branch } = task.outcome;
    if (!base || !branch) throw new ReviewError('Cette tâche n’a pas de branche à relire.');
    return this.changes.of(task.repository.root, base, branch);
  }

  async info(id: number): Promise<ReviewInfo> {
    const task = await this.tasks.get(id);
    const rights = await this.rights.rightsOf(task.repository.name);
    const { base, branch } = task.outcome;
    const commits = base && branch ? await this.changes.commits(task.repository.root, base, branch) : 0;
    const account = await this.githubAccountOf(task.repository.name);
    const blocked =
      branch && task.outcome.from
        ? await this.publisher.availability(task.repository.root, account)
        : 'La tâche n’a pas de branche à pousser.';
    return { pullRequest: rights.pullRequest, blocked, commits };
  }

  /**
   * Valide la tâche, puis pousse sa branche et ouvre une PR brouillon selon le réglage du dépôt : jamais, sur demande
   * (pullRequest fourni) ou toujours. Bosco ne fusionne jamais (règle 6).
   */
  async validate(id: number, pullRequest: null | { body: string; title: string }): Promise<Validation> {
    const task = await this.tasks.validate(id);
    const rights = await this.rights.rightsOf(task.repository.name);
    const wanted =
      rights.pullRequest === 'always' || (rights.pullRequest === 'ask' && pullRequest !== null)
        ? (pullRequest ?? { title: task.title, body: pullRequestBody(task) })
        : null;
    if (!wanted || !task.outcome.branch || !task.outcome.from) return { task, pullRequestError: null };
    try {
      const account = await this.githubAccountOf(task.repository.name);
      const url = await this.publisher.publish(
        task.repository.root,
        {
          branch: task.outcome.branch,
          from: task.outcome.from,
          title: wanted.title.trim() || task.title,
          body: wanted.body,
        },
        account,
      );
      return { task: await this.tasks.attachPullRequest(id, url), pullRequestError: null };
    } catch (error) {
      return { task, pullRequestError: error instanceof Error ? error.message : String(error) };
    }
  }

  /** Réessayer après un envoi en échec : la tâche est déjà validée. */
  async retryPullRequest(id: number, pullRequest: { body: string; title: string }): Promise<Validation> {
    const task = await this.tasks.get(id);
    if (task.state !== 'validated' || !task.outcome.branch || !task.outcome.from)
      throw new ReviewError('Seule une tâche validée avec sa branche peut ouvrir une PR.');
    try {
      const account = await this.githubAccountOf(task.repository.name);
      const url = await this.publisher.publish(
        task.repository.root,
        { branch: task.outcome.branch, from: task.outcome.from, ...pullRequest },
        account,
      );
      return { task: await this.tasks.attachPullRequest(id, url), pullRequestError: null };
    } catch (error) {
      return { task, pullRequestError: error instanceof Error ? error.message : String(error) };
    }
  }

  /** Rejet (E7b) : avec relance, le motif rejoint la consigne ; sans, les suivantes échouent en cascade. */
  reject(id: number, reason: string, relaunch: boolean): Promise<TaskView> {
    if (!reason.trim()) throw new ReviewError('Écris le motif du rejet : il est transmis à l’agent.');
    return relaunch ? this.tasks.rejectAndRelaunch(id, reason.trim()) : this.tasks.reject(id, reason.trim());
  }
}
