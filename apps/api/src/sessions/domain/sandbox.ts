import { DomainError } from '../../shared/domain/domain-error.ts';

/**
 * Bac à sable d'une session pilotée (règle 12, DT-37) : un conteneur isolé du poste, qui travaille sur une copie du
 * dépôt et sa propre branche. La copie et la conversation sont gardées hors du conteneur, qui reste démarré pendant
 * la session et s'arrête après un temps sans message.
 */
export interface SandboxInfo {
  /** Point de départ de la branche (commit), d'où se calculent ses modifications */
  base: string;
  /** Branche de la session, dans la copie puis dans le dépôt du poste (« bosco/s-typescript-6 ») */
  branch: string;
  /** Branche de départ (« develop ») */
  from: string;
  /** Dernier message envoyé : il décide de l'arrêt et de la suppression */
  lastMessageAt: Date;
  /** Profil dont l'accès à l'abonnement est copié dans le bac à sable */
  profile: string;
  /** Bac à sable supprimé : la session reste lisible, mais ne se reprend plus */
  removedAt: Date | null;
  /** Dernière récupération de la branche dans le dépôt du poste */
  retrievedAt: Date | null;
  /** Notification de la veille envoyée, pour la suppression automatique */
  warnedAt: Date | null;
}

/** Arrêt du conteneur après ce délai sans message (règle 12). */
export const SANDBOX_IDLE_MS = 30 * 60 * 1000;
/** Suppression du bac à sable après ce délai sans message (règle 12). */
export const SANDBOX_KEEP_MS = 7 * 24 * 60 * 60 * 1000;
/** Notification de la veille, avant la suppression. */
export const SANDBOX_WARN_MS = SANDBOX_KEEP_MS - 24 * 60 * 60 * 1000;

export class SandboxError extends DomainError {}

/** Préfixe des branches de session : on les reconnaît dans le dépôt. */
const PREFIX = 'bosco/s-';

/** « bosco/s-monte-typescript-en-version-6 », d'après le premier message. */
export function sandboxBranchOf(text: string): string {
  const slug = text
    .normalize('NFD')
    .replaceAll(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '')
    .slice(0, 40)
    .replace(/-$/, '');
  return `${PREFIX}${slug || 'session'}`;
}

/** Nom de branche donné à la main : sous le préfixe, sans caractère que git refuse. */
export function checkSandboxBranch(name: string): string {
  const branch = name.trim();
  if (!branch.startsWith(PREFIX) || branch.length === PREFIX.length)
    throw new SandboxError('invalidSandboxBranch', `La branche de la session commence par ${PREFIX}.`);
  if (!/^[\w./-]+$/.test(branch) || branch.includes('..') || branch.endsWith('/') || branch.endsWith('.lock'))
    throw new SandboxError('invalidSandboxBranch', `« ${branch} » n’est pas un nom de branche valide.`);
  return branch;
}

/** Ce qu'il faut faire d'un bac à sable, à cet instant : rien, l'arrêter, prévenir, ou le supprimer. */
export function housekeepingOf(
  sandbox: SandboxInfo,
  now: Date,
  state: { running: boolean; turn: boolean },
): 'remove' | 'stop' | 'warn' | null {
  if (sandbox.removedAt || state.turn) return null;
  const idle = now.getTime() - sandbox.lastMessageAt.getTime();
  if (idle >= SANDBOX_KEEP_MS) return 'remove';
  if (idle >= SANDBOX_WARN_MS && !sandbox.warnedAt) return 'warn';
  if (idle >= SANDBOX_IDLE_MS && state.running) return 'stop';
  return null;
}

/** Heure à laquelle le conteneur s'arrêtera sans nouveau message. */
export function stopsAt(sandbox: SandboxInfo): Date {
  return new Date(sandbox.lastMessageAt.getTime() + SANDBOX_IDLE_MS);
}
