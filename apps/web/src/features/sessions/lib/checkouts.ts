import type { CheckoutChoiceDto, ProjectCheckoutsDto } from '@bosco/domain';
import type { OptionProject } from './new-session';

/** Valeur du choix par défaut : la branche active (sur le poste), ou la branche de départ du projet (en bac à sable). */
export const DEFAULT_CHECKOUT = '';

/** Une option du choix « Branche ou worktree », rangée sous son type. */
export interface CheckoutOption {
  /** « feat/tarifs · worktree », « develop · branche » : le type se lit dans le libellé, pas seulement dans le groupe */
  label: string;
  value: string;
}

export interface CheckoutOptions {
  branches: CheckoutOption[];
  /** Libellé du choix par défaut, en tête */
  defaultLabel: string;
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

/**
 * Options du choix « Branche ou worktree » d'un projet. En tête, le défaut : la branche active du dossier du projet, ou
 * en bac à sable la branche de départ réglée pour le projet ; puis ses worktrees, puis ses autres branches, chacun
 * nommé avec son type.
 */
export function checkoutOptions(
  project: OptionProject,
  checkouts: ProjectCheckoutsDto | undefined,
  sandboxed: boolean,
): CheckoutOptions {
  const active = checkouts?.active ?? project.branch;
  const start = sandboxed ? projectStart(project, active) : null;
  const defaultLabel = start
    ? `${start} · branche de départ du projet`
    : `${active ?? 'branche courante'} · branche active`;
  const branches = [...(start && active ? [active] : []), ...(checkouts?.branches ?? [])].filter(
    (branch) => branch !== start,
  );
  return {
    defaultLabel,
    worktrees: (checkouts?.worktrees ?? []).map(({ branch, path }) => ({
      label: `${branch ?? 'détaché'} · worktree`,
      value: `${WORKTREE}${path}`,
    })),
    branches: branches.map((branch) => ({ label: `${branch} · branche`, value: `${BRANCH}${branch}` })),
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

/** Ce que dit le choix sous le champ, en bac à sable : d'où part la copie, et ce qu'elle ne prend pas. */
export function sandboxHint(
  value: string,
  checkouts: ProjectCheckoutsDto | undefined,
  options: CheckoutOptions,
): string {
  const choice = checkoutChoiceOf(value);
  if (choice?.kind === 'worktree') {
    const worktree = checkouts?.worktrees.find(({ path }) => path === choice.path);
    const from = worktree?.branch ?? 'son commit';
    return `Copie de ${from}, la branche du worktree, telle qu’enregistrée : ses fichiers modifiés ne sont pas copiés.`;
  }
  const from = choice?.branch ?? options.defaultLabel.split(' · ')[0] ?? 'la branche courante';
  return `Copie de ${from} telle qu’enregistrée : les fichiers modifiés du poste ne sont pas copiés.`;
}
