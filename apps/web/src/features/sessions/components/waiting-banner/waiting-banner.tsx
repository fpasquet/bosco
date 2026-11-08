import { Check, Eye, Hand, SquareTerminal, X } from 'lucide-react';
import Link from 'next/link';
import type { SessionDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';
import { clockOf } from '../../lib/detail';
import { elapsed } from '../../lib/format';
import { titleOf } from '../sessions-table';
import { WaitingSummary } from '../waiting-summary';

export interface WaitingActionsProps {
  /** Session dont la réponse part : ses boutons attendent */
  busyId: null | string;
  /** Bosco injoignable : une réponse n'arriverait pas à l'agent, elle se donne dans le terminal (CA-SESS-24) */
  offline?: boolean;
  onAllow: (session: SessionDto) => void;
}

export const detailOf = (session: SessionDto) => `/sessions/${encodeURIComponent(session.id)}`;

/**
 * « Autoriser » et « Refuser » pour une autorisation ; « Refuser » ouvre le détail pour écrire un motif (E2b). Un tour
 * terminé se répond dans le terminal : seulement « Voir la session » (RF-SESS-03, RF-SESS-04).
 */
export function WaitingActions({
  busyId,
  offline = false,
  onAllow,
  session,
}: WaitingActionsProps & { session: SessionDto }) {
  if (session.waiting?.kind !== 'permission') {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href={detailOf(session)}>
          <Eye aria-hidden className="size-3.5" />
          Voir la session
        </Link>
      </Button>
    );
  }
  const busy = busyId === session.id || offline;
  return (
    <div className="flex gap-2">
      {offline ? (
        <Button variant="outline" size="sm" className="max-md:btn-md" disabled>
          <X aria-hidden className="size-3.5" />
          Refuser
        </Button>
      ) : (
        <Button variant="outline" size="sm" className="max-md:btn-md" asChild>
          <Link href={detailOf(session)}>
            <X aria-hidden className="size-3.5" />
            Refuser
          </Link>
        </Button>
      )}
      <Button variant="primary" size="sm" className="max-md:btn-md" disabled={busy} onClick={() => onAllow(session)}>
        <Check aria-hidden className="size-3.5" />
        Autoriser
      </Button>
    </div>
  );
}

/** « labo-ia/packages/bosco · feat/specs » */
export function placeOf(session: SessionDto): string {
  const place = session.repository
    ? [session.repository.name, session.repository.folder].filter(Boolean).join('/')
    : (session.repoPath ?? 'Hors dépôt git');
  return session.branch ? `${place} · ${session.branch}` : place;
}

/**
 * Bandeau des sessions qui t'attendent, en tête de la vue d'ensemble, la plus ancienne attente en premier (E1b,
 * CA-SESS-05). Il n'existe qu'avec le suivi en direct, et disparaît quand la dernière reçoit sa réponse.
 */
export function WaitingBanner({
  now,
  sessions,
  ...actions
}: WaitingActionsProps & { now: Date; sessions: SessionDto[] }) {
  if (sessions.length === 0) return null;
  const oldest = sessions[0]?.waiting?.since;
  return (
    <section
      aria-label="Sessions qui t’attendent"
      className="rounded-card border border-warning bg-surface shadow-card"
    >
      <h2 className="flex items-center gap-2 rounded-t-card bg-warning-soft px-4 py-2.5 text-warning">
        <Hand aria-hidden className="size-4" />
        <b className="font-semibold">
          {sessions.length > 1 ? `${sessions.length} sessions attendent ta réponse` : '1 session attend ta réponse'}
        </b>
        {oldest && sessions.length > 1 && (
          <span className="ml-auto text-xs font-normal">
            la plus ancienne depuis {actions.offline ? clockOf(oldest) : elapsed(new Date(oldest), now)}
          </span>
        )}
      </h2>
      <ul className="divide-y divide-line">
        {sessions.map((session) => (
          <li key={session.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:flex-nowrap">
            <span className="grid size-7 shrink-0 place-items-center rounded-control bg-surface-alt text-muted">
              <SquareTerminal aria-hidden className="size-4" />
            </span>
            <div className="min-w-0 flex-1 md:w-72 md:flex-none">
              <Link href={detailOf(session)} className="block link truncate font-medium link-hover">
                {titleOf(session)}
              </Link>
              <p className="truncate font-mono text-xs text-muted">{placeOf(session)}</p>
            </div>
            <div className="w-full min-w-0 md:w-auto md:flex-1">
              <WaitingSummary session={session} />
            </div>
            <span className="text-xs text-muted tabular-nums md:w-12 md:text-right">
              {session.waiting &&
                (actions.offline ? clockOf(session.waiting.since) : elapsed(new Date(session.waiting.since), now))}
            </span>
            <WaitingActions session={session} {...actions} />
          </li>
        ))}
      </ul>
    </section>
  );
}
