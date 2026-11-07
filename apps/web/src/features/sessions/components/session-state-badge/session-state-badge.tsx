import type { SessionStateDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { STATE_LABELS } from '../../lib/overview';

const STYLES: Record<SessionStateDto, { badge: string; dot: string }> = {
  running: { badge: 'badge-soft badge-info', dot: 'animate-pulse bg-info' },
  ended: { badge: 'badge-soft badge-success', dot: 'bg-success' },
  inactive: { badge: 'badge-ghost', dot: 'bg-muted' },
};

/** État d'une session : le libellé porte l'état, la couleur ne fait que le souligner (NF-18). */
export function SessionStateBadge({ state }: { state: SessionStateDto }) {
  const { badge, dot } = STYLES[state];
  return (
    <span className={cn('badge gap-1.5 badge-sm whitespace-nowrap', badge)}>
      <span aria-hidden className={cn('size-1.5 rounded-full', dot)} />
      {STATE_LABELS[state]}
    </span>
  );
}
