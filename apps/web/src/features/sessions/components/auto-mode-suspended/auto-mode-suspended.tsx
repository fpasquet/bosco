import { ShieldAlert } from 'lucide-react';
import type { JournalEntryDto } from '@bosco/domain';
import { APP_NAME } from '@bosco/domain';
import { clockOf } from '../../lib/detail';

/** Suspension d'« Approuver pour moi », gardée dans le journal de la session. */
export type AutoModeSuspension = Extract<JournalEntryDto, { kind: 'autoModeSuspended' }>;

/**
 * Ligne du fil, à son heure, quand Claude Code suspend « Approuver pour moi » : après 3 refus de suite ou 20 au total,
 * les demandes reviennent dans Bosco.
 */
export function AutoModeSuspended({ suspended }: { suspended: Pick<AutoModeSuspension, 'at' | 'count' | 'total'> }) {
  const after = suspended.total ? `${suspended.count} refus au total` : `${suspended.count} refus`;
  return (
    <p className="flex flex-wrap items-center gap-2 rounded-card border border-warning bg-warning-soft px-3 py-2 text-sm">
      <ShieldAlert aria-hidden className="size-4 shrink-0 text-warning" />
      <span className="min-w-0 flex-1">
        Approuver pour moi suspendu après {after} : les demandes reviennent dans {APP_NAME}
      </span>
      <time dateTime={suspended.at} className="font-mono text-xs text-muted tabular-nums">
        {clockOf(suspended.at)}
      </time>
    </p>
  );
}
