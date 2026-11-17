import type { SessionStateDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { STATE_LABELS } from '../../lib/overview';

const STYLES: Record<SessionStateDto, { badge: string; dot: string }> = {
  running: { badge: 'badge-soft badge-info', dot: 'animate-pulse bg-info' },
  ended: { badge: 'badge-soft badge-success', dot: 'bg-success' },
  waiting: { badge: 'badge-soft badge-warning', dot: 'bg-warning' },
  inactive: { badge: 'badge-ghost', dot: 'bg-muted' },
};

/** État d'une session : le libellé porte l'état, la couleur ne fait que le souligner (NF-18). */
/** `still` : les données sont figées (Bosco injoignable), la pastille ne s'anime plus (E1f). */
export function SessionStateBadge({ state, still = false }: { state: SessionStateDto; still?: boolean }) {
  const { badge, dot } = STYLES[state];
  return (
    <span className={cn('badge gap-1.5 badge-sm whitespace-nowrap', badge)}>
      <span aria-hidden className={cn('size-1.5 rounded-full', dot, still && 'animate-none')} />
      {STATE_LABELS[state]}
    </span>
  );
}
