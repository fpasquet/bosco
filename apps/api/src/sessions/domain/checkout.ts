import { join } from 'node:path';
import { DomainError } from '../../shared/domain/domain-error.ts';

/**
 * Branches et worktrees d'un dépôt, proposés au démarrage d'une session : la branche active du dossier du projet, ses
 * worktrees (hors ce dossier) et les branches locales qui ne sont ouvertes nulle part.
 */
export interface ProjectCheckouts {
  /** Branche du dossier du projet ; null : HEAD détaché, ou pas de git */
  active: null | string;
  /** Branches locales ouvertes dans aucun worktree, par ordre alphabétique */
  branches: string[];
  /** Worktrees du dépôt, hors dossier du projet : leur dossier, leur branche (null : détaché) et leur commit */
  worktrees: { branch: null | string; head: string; path: string }[];
}

export const NO_CHECKOUTS: ProjectCheckouts = { active: null, branches: [], worktrees: [] };

/** Où une session travaille dans un projet : une branche du dépôt, ou un de ses worktrees (son dossier). */
export type CheckoutChoice = { branch: string; kind: 'branch' } | { kind: 'worktree'; path: string };

/** Un choix de branche ou de worktree que le dépôt ne connaît pas. */
export class CheckoutError extends DomainError {
  constructor(message: string) {
    super('invalidCheckout', message);
  }
}

/** Dossier où travaille une session du poste : celui du projet, un worktree existant, ou un worktree à créer. */
export type WorkstationTarget =
  { branch: string; kind: 'create' } | { kind: 'root' } | { kind: 'worktree'; path: string };

/**
 * Dossier de travail d'une session sur le poste. La branche active reste dans le dossier du projet ; une branche
 * ouverte dans un worktree y travaille ; une autre branche reçoit son propre worktree, pour ne jamais changer la
 * branche du dossier où la personne travaille. Sans choix : le dossier du projet.
 */
export function workstationTarget(checkouts: ProjectCheckouts, choice: CheckoutChoice | null): WorkstationTarget {
  if (!choice) return { kind: 'root' };
  if (choice.kind === 'worktree') {
    const worktree = checkouts.worktrees.find(({ path }) => path === choice.path);
    if (!worktree) throw new CheckoutError(`${choice.path} n’est pas un worktree de ce projet.`);
    return { kind: 'worktree', path: worktree.path };
  }
  if (choice.branch === checkouts.active) return { kind: 'root' };
  const opened = checkouts.worktrees.find(({ branch }) => branch === choice.branch);
  if (opened) return { kind: 'worktree', path: opened.path };
  if (!checkouts.branches.includes(choice.branch))
    throw new CheckoutError(`La branche ${choice.branch} n’existe pas dans ce projet.`);
  return { branch: choice.branch, kind: 'create' };
}

/**
 * Point de départ de la copie d'un bac à sable : la branche choisie, celle d'un worktree, ou son commit s'il est
 * détaché ; null sans choix (celle réglée pour le projet, sinon la courante).
 */
export function sandboxStart(checkouts: ProjectCheckouts, choice: CheckoutChoice | null): null | string {
  if (!choice) return null;
  if (choice.kind === 'branch') {
    const known =
      choice.branch === checkouts.active ||
      checkouts.branches.includes(choice.branch) ||
      checkouts.worktrees.some(({ branch }) => branch === choice.branch);
    if (!known) throw new CheckoutError(`La branche ${choice.branch} n’existe pas dans ce projet.`);
    return choice.branch;
  }
  const worktree = checkouts.worktrees.find(({ path }) => path === choice.path);
  if (!worktree) throw new CheckoutError(`${choice.path} n’est pas un worktree de ce projet.`);
  return worktree.branch ?? worktree.head;
}

/**
 * Dossier du worktree créé pour une branche : sous `.claude/worktrees` du projet, là où `claude --worktree` range les
 * siens, un dossier par branche (« feat/tarifs » : « feat-tarifs »).
 */
export function worktreePathOf(root: string, branch: string): string {
  return join(root, '.claude', 'worktrees', branch.replaceAll(/[^\w.-]+/g, '-'));
}
