import { DomainError } from '../../shared/domain/domain-error.ts';

/** États d'une tâche (RF-TACH-02). */
export type TaskState =
  | 'awaiting_session'
  | 'blocked'
  | 'cancelled'
  | 'failed'
  | 'queued'
  | 'rejected'
  | 'running'
  | 'to_review'
  | 'validated';

/** Worker : sans terminal, dans une copie jetable du dépôt ; Ma session : une session interactive la prend (RF-TACH-01). */
export type TaskMode = 'session' | 'worker';

/** Garde-fous d'une tâche, plafonnés par les droits du dépôt (RF-TACH-05). */
export interface Guardrails {
  budgetUsd: number;
  maxTurns: number;
  /** Modèle choisi ; null : celui hérité du dépôt */
  model: null | string;
  /** Outils autorisés ; null : ceux du dépôt */
  tools: null | string[];
}

export interface TaskLogEntry {
  at: Date;
  detail: null | string;
  event: string;
}

/** Ce qu'une tâche du worker a produit : sa branche, son compte rendu et le résumé de ses modifications (E7a). */
export interface TaskOutcome {
  /** Branche de la tâche, rapatriée dans le dépôt (« bosco/t-12-sncf ») */
  branch: null | string;
  changes: { added: number; files: number; removed: number } | null;
  /** Compte rendu de l'agent, tel qu'il le donne en fin de session */
  report: null | string;
  /** Session Claude Code de l'agent, pour son fil (E2c, E2d) */
  sessionId: null | string;
  turns: number;
}

export interface TaskSnapshot {
  /** Lien de contexte facultatif : ticket, PR, décision (RF-TACH-01) */
  context: null | string;
  createdAt: Date;
  /** Qui a créé la tâche : toi, ou une session Claude Code (E5a, annotation 3) */
  createdBy: 'person' | 'session';
  /** Motif d'un échec ou d'une annulation (« Préalable T-13 annulée », « Budget atteint ») */
  failure: null | string;
  /** Dossier de travail dans le dépôt ; vide : la racine */
  folder: string;
  guardrails: Guardrails;
  id: number;
  instruction: string;
  /** Journal des changements d'état, jamais vidé, même après une relance (E13a) */
  log: TaskLogEntry[];
  mode: TaskMode;
  outcome: TaskOutcome;
  prerequisites: number[];
  /** Dépôt : son nom et sa racine sur le poste */
  repository: { name: string; root: string };
  /** Dépense estimée de la tâche, en dollars */
  spentUsd: number;
  state: TaskState;
  updatedAt: Date;
}

export class TaskError extends DomainError {}

/** États d'une tâche qui n'a pas démarré : elle se modifie encore (RF-TACH-08). */
export const NOT_STARTED: readonly TaskState[] = ['awaiting_session', 'blocked', 'queued'];

/** États finaux : rien ne bouge plus, sauf la relance d'un échec ou d'un rejet. */
export const FINISHED: readonly TaskState[] = ['cancelled', 'failed', 'rejected', 'validated'];

/** Titre court d'une tâche, tiré de sa consigne : sa première phrase. */
export function titleOf(instruction: string): string {
  const first = instruction.trim().split(/(?<=[.!?:])\s/)[0] ?? instruction;
  const single = first.replaceAll(/\s+/g, ' ').trim().replace(/[.:]$/, '').trimEnd();
  return single.length > 80 ? `${single.slice(0, 79)}…` : single;
}

export class Task {
  private constructor(private snapshot: TaskSnapshot) {}

  get id(): number {
    return this.snapshot.id;
  }

  get state(): TaskState {
    return this.snapshot.state;
  }

  get prerequisites(): readonly number[] {
    return this.snapshot.prerequisites;
  }

  get mode(): TaskMode {
    return this.snapshot.mode;
  }

  get repository(): string {
    return this.snapshot.repository.name;
  }

  static create(
    fields: Omit<TaskSnapshot, 'createdAt' | 'failure' | 'log' | 'outcome' | 'spentUsd' | 'state' | 'updatedAt'>,
    at: Date,
  ): Task {
    const task = new Task({
      ...fields,
      prerequisites: [...new Set(fields.prerequisites)],
      createdAt: at,
      updatedAt: at,
      failure: null,
      spentUsd: 0,
      outcome: { branch: null, changes: null, report: null, sessionId: null, turns: 0 },
      state: 'blocked',
      log: [{ at, event: 'Créée', detail: fields.createdBy === 'session' ? 'par une session' : null }],
    });
    return task;
  }

  static restore(snapshot: TaskSnapshot): Task {
    return new Task({
      ...snapshot,
      log: [...snapshot.log],
      prerequisites: [...snapshot.prerequisites],
      outcome: snapshot.outcome ?? { branch: null, changes: null, report: null, sessionId: null, turns: 0 },
    });
  }

  /** État de départ d'une tâche prête : En file pour le worker, En attente d'une session sinon. */
  private readyState(): TaskState {
    return this.snapshot.mode === 'worker' ? 'queued' : 'awaiting_session';
  }

  private move(state: TaskState, at: Date, event: string, detail: null | string = null): void {
    this.snapshot = {
      ...this.snapshot,
      state,
      updatedAt: at,
      log: [...this.snapshot.log, { at, event, detail }],
    };
  }

  /** Les préalables sont toutes validées : la tâche part, ou attend encore (RF-TACH-03). */
  settle(prerequisitesValidated: boolean, at: Date): void {
    if (!NOT_STARTED.includes(this.snapshot.state)) return;
    const next = prerequisitesValidated ? this.readyState() : 'blocked';
    if (next === this.snapshot.state) return;
    this.move(next, at, next === 'blocked' ? 'Bloquée' : 'Prête', next === 'blocked' ? 'attend ses préalables' : null);
  }

  /** Modification tant que la tâche n'a pas démarré (RF-TACH-08). */
  edit(
    changes: Partial<
      Pick<TaskSnapshot, 'context' | 'folder' | 'guardrails' | 'instruction' | 'mode' | 'prerequisites'>
    >,
    at: Date,
  ): void {
    if (!NOT_STARTED.includes(this.snapshot.state))
      throw new TaskError('taskStarted', `Task T-${this.id} has started and can no longer be edited`);
    this.snapshot = { ...this.snapshot, ...changes, updatedAt: at };
    this.move(this.snapshot.state, at, 'Modifiée');
  }

  start(at: Date, detail: null | string = null): void {
    if (!['awaiting_session', 'queued'].includes(this.snapshot.state))
      throw new TaskError('taskNotReady', `Task T-${this.id} is not ready to start`);
    this.move('running', at, 'Démarrée', detail);
  }

  /** Avancement de l'agent : dépense, tours, branche et session, tenus à jour pendant qu'il travaille. */
  progress(spentUsd: number, outcome: Partial<TaskOutcome>, at: Date): void {
    this.snapshot = { ...this.snapshot, spentUsd, updatedAt: at, outcome: { ...this.snapshot.outcome, ...outcome } };
  }

  /** L'agent a fini : la tâche attend ta relecture (E7a). */
  finish(spentUsd: number, outcome: Partial<TaskOutcome>, at: Date): void {
    this.progress(spentUsd, outcome, at);
    this.move('to_review', at, 'À relire');
  }

  fail(reason: string, at: Date): void {
    if (FINISHED.includes(this.snapshot.state)) return;
    this.snapshot = { ...this.snapshot, failure: reason };
    this.move('failed', at, 'En échec', reason);
  }

  /** Annulation à tout moment (RF-TACH-07) ; une tâche finie ne s'annule plus. */
  cancel(at: Date): void {
    if (FINISHED.includes(this.snapshot.state))
      throw new TaskError('taskFinished', `Task T-${this.id} is already finished`);
    this.snapshot = { ...this.snapshot, failure: 'Annulée' };
    this.move('cancelled', at, 'Annulée');
  }

  validate(at: Date): void {
    if (this.snapshot.state !== 'to_review')
      throw new TaskError('taskNotToReview', `Task T-${this.id} is not to review`);
    this.move('validated', at, 'Validée');
  }

  reject(reason: null | string, at: Date): void {
    if (this.snapshot.state !== 'to_review')
      throw new TaskError('taskNotToReview', `Task T-${this.id} is not to review`);
    this.snapshot = { ...this.snapshot, failure: reason ?? 'Rejetée' };
    this.move('rejected', at, 'Rejetée', reason);
  }

  /** Relance d'un échec ou d'un rejet : même numéro, journal gardé, budget revu si besoin (RF-TACH-08). */
  relaunch(guardrails: Guardrails, at: Date, detail: null | string): void {
    if (!['failed', 'rejected'].includes(this.snapshot.state))
      throw new TaskError('taskNotFailed', `Task T-${this.id} has not failed`);
    this.snapshot = { ...this.snapshot, guardrails, failure: null };
    this.move('blocked', at, 'Relancée', detail);
  }

  toSnapshot(): TaskSnapshot {
    return { ...this.snapshot, log: [...this.snapshot.log], prerequisites: [...this.snapshot.prerequisites] };
  }
}
