import type { CheckoutChoiceDto, ProjectCheckoutsDto } from '@bosco/domain';
import type { OptionProject } from './new-session';

/**
 * Valeur du choix par défaut : la branche active (sur le poste), ou la branche de départ du projet (en bac à sable).
 * Une liste déroulante de Radix ne prend pas de valeur vide.
 */
export const DEFAULT_CHECKOUT = 'default';

/** Une option du choix « Branche ou worktree », rangée sous son groupe (Worktrees, Branches) qui dit son type. */
export interface CheckoutOption {
  /** Ce que la branche a de particulier : « active », « départ du projet » */
  badge?: string;
  /** Dossier d'un worktree, depuis celui du projet quand il y est (« .claude/worktrees/tarifs ») */
  hint?: string;
  /** Nom de la branche, ou « détaché » */
  label: string;
  value: string;
}

export interface CheckoutOptions {
  branches: CheckoutOption[];
  /** Le choix par défaut, en tête */
  default: CheckoutOption;
  worktrees: CheckoutOption[];
}

const WORKTREE = 'worktree:';
const BRANCH = 'branch:';

/** Ce que l'API reçoit pour une valeur du choix ; null : le choix par défaut. */
export function checkoutChoiceOf(value: string): CheckoutChoiceDto | null {
  if (value.startsWith(WORKTREE)) return { kind: 'worktree', path: value.slice(WORKTREE.length) };
  if (value.startsWith(BRANCH)) return { kind: 'branch', branch: value.slice(BRANCH.length) };
  return null;
}

/** Branche de départ réglée pour le projet, quand elle n'est pas sa branche active : le défaut en bac à sable. */
function projectStart(project: OptionProject, active: null | string): null | string {
  return project.startBranch && project.startBranch !== active ? project.startBranch : null;
}

/** Dossier d'un worktree tel que la liste l'écrit : depuis celui du projet quand il y est. */
function folderOf(root: string, path: string): string {
  return path.startsWith(`${root}/`) ? path.slice(root.length + 1) : path;
}

/**
 * Options du choix « Branche ou worktree » d'un projet. En tête, le défaut : la branche active du dossier du projet, ou
 * en bac à sable la branche de départ réglée pour le projet ; puis ses worktrees, puis ses autres branches. Le groupe
 * dit le type ; seule la branche active, ou celle de départ, porte un badge.
 */
export function checkoutOptions(
  project: OptionProject,
  checkouts: ProjectCheckoutsDto | undefined,
  sandboxed: boolean,
): CheckoutOptions {
  const active = checkouts?.active ?? project.branch;
  const start = sandboxed ? projectStart(project, active) : null;
  const first: CheckoutOption = start
    ? { badge: 'départ du projet', label: start, value: DEFAULT_CHECKOUT }
    : { badge: 'active', label: active ?? 'branche courante', value: DEFAULT_CHECKOUT };
  const others = (checkouts?.branches ?? []).filter((branch) => branch !== start);
  return {
    default: first,
    worktrees: (checkouts?.worktrees ?? []).map(({ branch, path }) => ({
      hint: folderOf(project.root, path),
      label: branch ?? 'détaché',
      value: `${WORKTREE}${path}`,
    })),
    branches: [
      ...(start && active ? [{ badge: 'active', label: active, value: `${BRANCH}${active}` }] : []),
      ...others.map((branch) => ({ label: branch, value: `${BRANCH}${branch}` })),
    ],
  };
}

/**
 * Dossier où travaillera une session du poste : celui du projet, celui du worktree choisi, ou le worktree que Bosco
 * créera pour une autre branche (`.claude/worktrees/<branche>`, comme l'API).
 */
export function workdirOf(root: string, value: string, checkouts: ProjectCheckoutsDto | undefined): string {
  const choice = checkoutChoiceOf(value);
  if (!choice) return root;
  if (choice.kind === 'worktree') return choice.path;
  if (choice.branch === checkouts?.active) return root;
  const opened = checkouts?.worktrees.find(({ branch }) => branch === choice.branch);
  return opened?.path ?? `${root}/.claude/worktrees/${choice.branch.replaceAll(/[^\w.-]+/g, '-')}`;
}

/** Ce que dit le choix sous le champ, sur le poste : où la session travaillera, et ce qui reste intact. */
export function workstationHint(value: string, checkouts: ProjectCheckoutsDto | undefined): string {
  const choice = checkoutChoiceOf(value);
  if (!choice) return 'Dans le dossier du projet, sur sa branche active.';
  if (choice.kind === 'worktree') return 'Dans le dossier de ce worktree : le dossier du projet garde sa branche.';
  if (checkouts?.worktrees.some(({ branch }) => branch === choice.branch))
    return 'Dans le worktree où cette branche est déjà ouverte.';
  return `Bosco crée un worktree pour ${choice.branch} dans .claude/worktrees du projet : ton dossier garde sa branche.`;
}

/** Nom court de ce qui est choisi, pour le récapitulatif : « le worktree feat/tarifs », « la branche develop ». */
export function checkoutName(value: string, checkouts: ProjectCheckoutsDto | undefined): null | string {
  const choice = checkoutChoiceOf(value);
  if (!choice) return null;
  if (choice.kind === 'branch') return `la branche ${choice.branch}`;
  const worktree = checkouts?.worktrees.find(({ path }) => path === choice.path);
  return `le worktree ${worktree?.branch ?? 'détaché'}`;
}

/** « 3 fichiers modifiés du poste non copiés », ou null quand la copie prend tout. */
export function uncopied(changes: null | number): null | string {
  if (!changes) return null;
  return changes > 1 ? `${changes} fichiers modifiés du poste non copiés` : '1 fichier modifié du poste non copié';
}

/**
 * Ce que dit le choix sous le champ, en bac à sable : d'où part la copie, et ce qu'elle ne prend pas, avec le nombre de
 * fichiers modifiés du dossier du projet, comme la colonne « Copie » de plusieurs projets.
 */
export function sandboxHint(
  value: string,
  checkouts: ProjectCheckoutsDto | undefined,
  options: CheckoutOptions,
  changes: null | number,
): string {
  const choice = checkoutChoiceOf(value);
  if (choice?.kind === 'worktree') {
    const worktree = checkouts?.worktrees.find(({ path }) => path === choice.path);
    const from = worktree?.branch ?? 'son commit';
    return `Copie de ${from}, la branche du worktree, telle qu’enregistrée : ses fichiers modifiés ne sont pas copiés.`;
  }
  const from = choice?.branch ?? options.default.label;
  return `Copie de ${from} telle qu’enregistrée : ${uncopied(changes) ?? 'aucun fichier modifié sur le poste'}.`;
}
