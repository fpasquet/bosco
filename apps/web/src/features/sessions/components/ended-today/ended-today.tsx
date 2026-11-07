import Link from 'next/link';
import type { SessionDto } from '@bosco/domain';
import { clockOf } from '../../lib/detail';
import { formatCost } from '../../lib/format';
import { titleOf } from '../sessions-table';

export interface EndedTodayProps {
  /** Dépôt filtré (E1c) : le lien ouvre l'historique déjà filtré sur lui */
  repository: null | string;
  /** Sessions terminées aujourd'hui, des plus récentes aux plus anciennes */
  sessions: SessionDto[];
}

/** Lignes montrées ; le reste est dans l'historique (E1d). */
const SHOWN = 4;

/** Sessions terminées aujourd'hui, sous la vue d'ensemble, avec « Voir l'historique » (E1c, E1d ; CA-SESS-13). */
export function EndedToday({ repository, sessions }: EndedTodayProps) {
  if (sessions.length === 0) return null;
  const history = repository ? `/history?repo=${encodeURIComponent(repository)}` : '/history';
  const rest = sessions.length - SHOWN;
  return (
    <section aria-labelledby="ended-today" className="rounded-card border border-line bg-surface shadow-card">
      <h2
        id="ended-today"
        className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-xs font-semibold text-muted"
      >
        {repository ? 'Terminées aujourd’hui dans ce dépôt' : 'Terminées aujourd’hui'}
        <span className="badge badge-ghost font-mono badge-sm">{sessions.length}</span>
        <Link href={history} className="ml-auto link font-normal link-primary">
          Voir l’historique
        </Link>
      </h2>
      <ul className="divide-y divide-line">
        {sessions.slice(0, SHOWN).map((session) => (
          <li key={session.id} className="relative flex items-center gap-3 px-4 py-2">
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
