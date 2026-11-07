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
