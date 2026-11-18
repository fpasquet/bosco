import type { DecisionDto, DecisionStateDto } from '@bosco/domain';

export const DECISION_STATES: Record<DecisionStateDto, { badge: string; label: string }> = {
  proposed: { label: 'Proposée', badge: 'badge-soft badge-warning' },
  accepted: { label: 'Acceptée', badge: 'badge-soft badge-success' },
  refused: { label: 'Refusée', badge: 'badge-ghost' },
  replaced: { label: 'Remplacée', badge: 'badge-ghost' },
  abandoned: { label: 'Abandonnée', badge: 'badge-ghost' },
};

export function titleOf(decision: DecisionDto): string {
  return decision.versions.at(-1)?.title ?? '';
}

const DAY = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const TIME = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

/** « 3 nov. » ; « 14:54 » le jour même. */
export function dateOf(at: string, now: Date): string {
  const date = new Date(at);
  return date.toDateString() === now.toDateString() ? TIME.format(date) : DAY.format(date);
}

/** Ce qui entoure la partie changée d'un champ, coupé à ce nombre de caractères de part et d'autre. */
const AROUND = 40;

/**
 * Partie changée d'un champ par rapport à la version modifiée : ce qui diffère entre le début et la fin communs.
 * null quand le texte n'a pas changé ; changed est vide quand la modification n'a fait que retirer du texte.
 */
export function changedPart(before: string, after: string): null | { changed: string; prefix: string; suffix: string } {
  if (before === after) return null;
  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) start += 1;
  let end = 0;
  while (
    end < before.length - start &&
    end < after.length - start &&
    before[before.length - 1 - end] === after[after.length - 1 - end]
  )
    end += 1;
  const prefix = after.slice(0, start);
  const suffix = after.slice(after.length - end);
  return {
    changed: after.slice(start, after.length - end),
    prefix: prefix.length > AROUND ? `…${prefix.slice(-AROUND)}` : prefix,
    suffix: suffix.length > AROUND ? `${suffix.slice(0, AROUND)}…` : suffix,
  };
}
