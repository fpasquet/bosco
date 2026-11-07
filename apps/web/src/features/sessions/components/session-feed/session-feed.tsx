'use client';
import type { ReactNode } from 'react';
import { ArrowDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { JournalEntryDto, SessionDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { Button } from '@/shared/ui/button';
import { clockOf } from '../../lib/detail';
import { actionLabel, elapsed } from '../../lib/format';

export interface SessionFeedProps {
  journal: JournalEntryDto[];
  now: Date;
  session: SessionDto;
  /** Carte affichée à la fin du fil, quand l'agent attend une autorisation (E2b) */
  tail?: ReactNode;
}

/** Écart sous lequel on est encore « en bas » du fil : le fil suit alors les nouveaux événements. */
const BOTTOM_SLACK_PX = 48;

function Entry({ current, entry }: { current: boolean; entry: JournalEntryDto }) {
  if (entry.kind === 'tool') {
    return (
      <li className="flex items-center gap-3 font-mono text-xs text-muted">
        <time dateTime={entry.at} className="w-10 shrink-0 tabular-nums">
          {clockOf(entry.at)}
        </time>
        <span className="min-w-0 truncate" title={entry.text}>
          {actionLabel(entry.text)}
        </span>
        {current && (
          <span className="flex shrink-0 items-center gap-1.5 text-info">
            <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-info" />
            en cours
          </span>
        )}
      </li>
    );
  }
  const yours = entry.kind === 'prompt';
  return (
    <li className="flex gap-3">
      <time dateTime={entry.at} className="w-10 shrink-0 pt-0.5 font-mono text-xs text-muted tabular-nums">
        {clockOf(entry.at)}
      </time>
      <div className={cn('min-w-0 flex-1 rounded-card px-3 py-2', yours ? 'bg-primary-soft' : 'bg-surface-alt')}>
        <p className="text-xs font-semibold text-muted">{yours ? 'Toi' : 'Agent'}</p>
        <p className="wrap-break-word whitespace-pre-line">{yours ? `« ${entry.text} »` : entry.text}</p>
      </div>
    </li>
  );
}

/**
 * Fil d'une session (E2a) : le plus récent en bas, mis à jour sans recharger. Il suit les nouveaux événements tant
 * qu'on est en bas ; si on remonte, « Revenir au direct » ramène au dernier (CA-SESS-27, CA-SESS-28).
 */
export function SessionFeed({ journal, now, session, tail }: SessionFeedProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const [following, setFollowing] = useState(true);
  const last = journal.at(-1);
  useEffect(() => {
    const element = scroller.current;
    if (element && following) element.scrollTop = element.scrollHeight;
  }, [following, journal.length, tail]);
  const live = session.state === 'running';
  const open = session.state !== 'ended';
  const status =
    session.state === 'waiting'
      ? 'en pause, l’agent attend ta réponse'
      : `dernier événement il y a ${elapsed(new Date(session.lastEventAt), now)}`;
  return (
    <section
      aria-labelledby="feed-title"
      className="relative flex min-h-0 flex-col rounded-card border border-line bg-surface shadow-card"
    >
      <h2 id="feed-title" className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-xs text-muted">
        <b className="font-semibold text-ink">{open ? 'Fil en direct' : 'Fil'}</b>· {status}
        {journal[0] && last && (
          <span className="ml-auto font-mono tabular-nums">
            {clockOf(journal[0].at)} → {clockOf(last.at)}
          </span>
        )}
      </h2>
      <div
        ref={scroller}
        role="log"
        aria-labelledby="feed-title"
        tabIndex={0}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-3"
        onScroll={(event) => {
          const element = event.currentTarget;
          setFollowing(element.scrollHeight - element.scrollTop - element.clientHeight < BOTTOM_SLACK_PX);
        }}
      >
        {journal.length === 0 ? (
          <p className="text-muted">Rien à montrer pour l’instant.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {journal.map((entry) => (
              <Entry key={entry.seq} entry={entry} current={live && entry === last && entry.kind === 'tool'} />
            ))}
          </ol>
        )}
        {tail}
      </div>
      {!following && (
        <Button
          size="sm"
          className="absolute bottom-3 left-1/2 -translate-x-1/2 shadow-overlay"
          onClick={() => setFollowing(true)}
        >
          <ArrowDown aria-hidden className="size-3.5" />
          Revenir au direct
        </Button>
      )}
    </section>
  );
}
