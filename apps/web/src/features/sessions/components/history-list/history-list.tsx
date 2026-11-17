'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { HistoryDayDto, SessionDto } from '@bosco/domain';
import { clockOf, durationEnd } from '../../lib/detail';
import { elapsed, formatCost, sessions as sessionsLabel } from '../../lib/format';
import { dayTitle, whereOf } from '../../lib/history';
import { SessionStateBadge } from '../session-state-badge';
import { titleOf } from '../sessions-table';

export interface HistoryListProps {
  days: HistoryDayDto[];
  now: Date;
  profileOf: (session: SessionDto) => null | string;
}

/** Jours affichés d'abord, puis à chaque arrivée en bas de la liste (CA-SESS-49). */
const DAYS_PER_PAGE = 7;

function Row({ now, profile, session }: { now: Date; profile: null | string; session: SessionDto }) {
  return (
    <tr className="relative h-row border-b border-line hover:bg-surface-alt">
      <td className="pl-4">
        <SessionStateBadge state={session.state} task={session.task} />
      </td>
      <td className="min-w-0">
        <Link
          href={`/sessions/${encodeURIComponent(session.id)}`}
          className="block truncate font-medium after:absolute after:inset-0"
        >
          {titleOf(session)}
        </Link>
        <span className="block truncate font-mono text-xs text-muted">{whereOf(session)}</span>
      </td>
      <td className="text-xs text-muted">{profile ?? '—'}</td>
      <td className="text-xs text-muted tabular-nums">
        {elapsed(new Date(session.startedAt), durationEnd(session, now))}
      </td>
      <td className="font-mono text-xs tabular-nums">{formatCost(session.cost)}</td>
      <td className="pr-4 text-right font-mono text-xs text-muted tabular-nums">{clockOf(session.startedAt)}</td>
    </tr>
  );
}

/** Historique jour par jour, du plus récent au plus ancien, chaque jour avec son total (E3a). */
export function HistoryList({ days, now, profileOf }: HistoryListProps) {
  const [shown, setShown] = useState(DAYS_PER_PAGE);
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = sentinel.current;
    if (!element || shown >= days.length) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setShown((count) => count + DAYS_PER_PAGE);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [days.length, shown]);
  if (days.length === 0) return <p className="text-muted">Aucune session ne correspond.</p>;
  return (
    <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-card">
      <table className="table w-full min-w-xl table-fixed text-left">
        <caption className="sr-only">Historique des sessions</caption>
        <thead className="text-xs text-muted">
          <tr className="h-9 border-b border-line">
            <th className="w-28 pl-4 font-medium">État</th>
            <th className="font-medium">Session · dépôt · dossier</th>
            <th className="w-20 font-medium">Profil</th>
            <th className="w-20 font-medium">Durée</th>
            <th className="w-20 font-medium">Coût</th>
            <th className="w-20 pr-4 text-right font-medium">Heure</th>
          </tr>
        </thead>
        {days.slice(0, shown).map((day) => (
          <tbody key={day.date}>
            <tr className="h-8 border-b border-line bg-surface-alt text-xs text-muted">
              <th colSpan={6} scope="colgroup" className="pl-4 font-normal">
                <b className="font-semibold text-ink">{dayTitle(day.date, now)}</b> ·{' '}
                {sessionsLabel(day.sessions.length)} · {formatCost({ unpriced: false, usd: day.costUsd })} estimés
              </th>
            </tr>
            {day.sessions.map((session) => (
              <Row key={session.id} now={now} session={session} profile={profileOf(session)} />
            ))}
          </tbody>
        ))}
      </table>
      {shown < days.length && <div ref={sentinel} aria-hidden className="h-8" />}
    </div>
  );
}
