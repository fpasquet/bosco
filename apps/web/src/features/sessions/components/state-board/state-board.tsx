'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import type { SessionDto, SessionStateDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { useIsPhone } from '@/shared/hooks/use-is-phone';
import { actionLabel, elapsed, formatCost, formatTokens } from '../../lib/format';
import { STATE_LABELS, totalTokens } from '../../lib/overview';
import { lastActionOf, titleOf } from '../sessions-table';
import { WaitingSummary } from '../waiting-summary';

export interface StateBoardProps {
  /** Boutons d'une session qui t'attend : les mêmes que dans le bandeau d'E1b (CA-SESS-14) */
  actionsOf?: (session: SessionDto) => ReactNode;
  columns: { sessions: SessionDto[]; state: SessionStateDto }[];
  now: Date;
}

const COLUMN_TITLES: Record<SessionStateDto, string> = { ...STATE_LABELS, ended: 'Terminées', inactive: 'Inactives' };

/** « labo-ia/rag » : le dépôt, et le dernier dossier quand la session tourne dans un sous-dossier. */
function placeOf(session: SessionDto): string {
  if (!session.repository) return 'Hors dépôt git';
  const { folder, name } = session.repository;
  return folder ? `${name}/${folder.split('/').at(-1) ?? folder}` : name;
}

function Card({ actionsOf, now, session }: Pick<StateBoardProps, 'actionsOf'> & { now: Date; session: SessionDto }) {
  const running = session.state === 'running';
  const waiting = session.state === 'waiting';
  return (
    <article className="relative flex flex-col gap-2 rounded-card border border-line bg-surface p-3 shadow-card hover:border-line-strong">
      <p className="flex items-center gap-2 font-mono text-xs text-muted">
        <span className="truncate">{placeOf(session)}</span>
        <span className="truncate">{session.branch ?? '—'}</span>
        <span className="ml-auto tabular-nums">{elapsed(new Date(session.lastEventAt), now)}</span>
      </p>
      <h3 className="font-medium">
        {/* La carte entière ouvre le détail de la session (E1d) ; ses boutons restent au-dessus */}
        <Link href={`/sessions/${encodeURIComponent(session.id)}`} className="after:absolute after:inset-0">
          {titleOf(session)}
        </Link>
      </h3>
      {waiting && (
        <>
          <WaitingSummary session={session} />
          <div className="relative z-10 flex">{actionsOf?.(session)}</div>
        </>
      )}
      {running ? (
        <ol aria-label="Dernières actions" className="flex flex-col gap-0.5 font-mono text-xs text-muted">
          {(session.recentActions.length > 0 ? session.recentActions : [lastActionOf(session, now)]).map(
            (action, index) => (
              <li key={`${index}-${action}`} className="truncate">
                <span aria-hidden>▸ </span>
                {actionLabel(action)}
              </li>
            ),
          )}
        </ol>
      ) : null}
      <p className="flex items-center gap-3 text-xs text-muted">
        <span>{running || waiting ? `depuis ${elapsed(new Date(session.startedAt), now)}` : 'sans événement'}</span>
        <span className="ml-auto font-mono tabular-nums">{formatTokens(totalTokens(session.usage))}</span>
        <span className="font-mono tabular-nums">{formatCost(session.cost)}</span>
      </p>
    </article>
  );
}

/** Teinte de la puce choisie : celle de l'état, comme ses badges ; les autres puces restent discrètes. */
const CHIP_TONES: Partial<Record<SessionStateDto, string>> = {
  running: 'bg-info-soft text-info',
  waiting: 'bg-warning-soft text-warning',
};

/** Balayage horizontal, en pixels, au-delà duquel on passe à la colonne voisine. */
const SWIPE_PX = 48;

function Column({
  actionsOf,
  now,
  sessions,
  state,
  titled,
}: Pick<StateBoardProps, 'actionsOf'> & StateBoardProps['columns'][number] & { now: Date; titled: boolean }) {
  return (
    <section aria-label={COLUMN_TITLES[state]} className="flex min-w-0 flex-1 flex-col gap-3">
      {titled && (
        <h2 className="flex items-center gap-2 text-xs font-semibold text-muted">
          {COLUMN_TITLES[state]}
          <span className="badge badge-ghost font-mono badge-sm">{sessions.length}</span>
        </h2>
      )}
      {sessions.map((session) => (
        <Card key={session.id} actionsOf={actionsOf} now={now} session={session} />
      ))}
      {sessions.length === 0 && (
        <p className="rounded-card border border-dashed border-line px-3 py-6 text-center text-xs text-muted">
          Aucune session
        </p>
      )}
    </section>
  );
}

/** Sur téléphone : des puces d'état en haut, une seule colonne à la fois, et un balayage qui passe à la voisine. */
function PhoneBoard({ actionsOf, columns, now }: StateBoardProps) {
  const first = columns.findIndex((column) => column.sessions.length > 0);
  const [index, setIndex] = useState(Math.max(0, first));
  const start = useRef<null | number>(null);
  const column = columns[Math.min(index, columns.length - 1)];
  return (
    <div className="flex flex-col gap-3">
      <div aria-label="Colonnes" className="-mx-4 flex gap-2 overflow-x-auto px-4">
        {columns.map(({ sessions, state }, position) => (
          <button
            key={state}
            type="button"
            aria-pressed={position === index}
            className={cn(
              'btn shrink-0 font-medium btn-sm',
              position === index
                ? ['border-transparent', CHIP_TONES[state] ?? 'bg-surface-alt text-ink']
                : 'border-line btn-outline text-muted',
            )}
            onClick={() => setIndex(position)}
          >
            {COLUMN_TITLES[state]} · {sessions.length}
          </button>
        ))}
      </div>
      <div
        onTouchStart={(event) => {
          start.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          const end = event.changedTouches[0]?.clientX;
          if (start.current === null || end === undefined) return;
          const distance = end - start.current;
          start.current = null;
          if (Math.abs(distance) < SWIPE_PX) return;
          setIndex((current) => Math.min(columns.length - 1, Math.max(0, current + (distance < 0 ? 1 : -1))));
        }}
      >
        {column && <Column {...column} actionsOf={actionsOf} now={now} titled={false} />}
      </div>
    </div>
  );
}

/**
 * Vue d'ensemble regroupée par état (E1d) : une colonne par état, côte à côte sur le poste. Sur téléphone, des puces
 * d'état défilent en haut et une seule colonne s'affiche à la fois.
 */
export function StateBoard(props: StateBoardProps) {
  const phone = useIsPhone();
  if (phone) return <PhoneBoard {...props} />;
  return (
    <div className="flex gap-4">
      {props.columns.map((column) => (
        <Column key={column.state} {...column} actionsOf={props.actionsOf} now={props.now} titled />
      ))}
    </div>
  );
}
