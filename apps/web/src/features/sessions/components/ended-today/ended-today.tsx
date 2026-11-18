import Link from 'next/link';
import type { SessionDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { clockOf } from '../../lib/detail';
import { formatCost } from '../../lib/format';
import { titleOf } from '../sessions-table';

export interface EndedTodayProps {
  /** Page d'un projet : le lien ouvre l'historique déjà filtré sur lui ; d'un groupe : l'historique */
  scope?: { history: string; label: string };
  /** Sessions terminées aujourd'hui, des plus récentes aux plus anciennes */
  sessions: SessionDto[];
}

/** Lignes montrées ; le reste est dans l'historique. */
const SHOWN = 4;

/** Lignes montrées sur le téléphone, avant le lien vers l'historique. */
const SHOWN_ON_PHONE = 2;

/**
 * Sessions terminées aujourd'hui, sous la vue par état, la page d'un projet ou d'un groupe, avec « Voir l'historique »
 *.
 */
export function EndedToday({ scope, sessions }: EndedTodayProps) {
  if (sessions.length === 0) return null;
  const history = scope?.history ?? '/history';
  const rest = sessions.length - SHOWN;
  return (
    <section aria-labelledby="ended-today" className="rounded-card border border-line bg-surface shadow-card">
      <h2
        id="ended-today"
        className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-xs font-semibold text-muted"
      >
        {scope ? `Terminées aujourd’hui ${scope.label}` : 'Terminées aujourd’hui'}
        <span className="badge badge-ghost font-mono badge-sm">{sessions.length}</span>
        <Link href={history} className="ml-auto link font-normal link-primary">
          Voir l’historique
        </Link>
      </h2>
      <ul className="divide-y divide-line">
        {sessions.slice(0, SHOWN).map((session, index) => (
          <li
            key={session.id}
            className={cn('relative flex items-center gap-3 px-4 py-2', index >= SHOWN_ON_PHONE && 'max-md:hidden')}
          >
            <Link
              href={`/sessions/${encodeURIComponent(session.id)}`}
              className="min-w-0 flex-1 truncate after:absolute after:inset-0"
            >
              {titleOf(session)}
            </Link>
            <span className="font-mono text-xs text-muted tabular-nums">{clockOf(session.lastEventAt)}</span>
            <span className="font-mono text-xs tabular-nums">{formatCost(session.cost)}</span>
          </li>
        ))}
      </ul>
      {rest > 0 && (
        <p className="border-t border-line px-4 py-2 text-xs text-muted">
          + {rest} {rest > 1 ? 'autres' : 'autre'} dans l’historique
        </p>
      )}
    </section>
  );
}
