import type { SessionDto, SessionStateDto } from '@bosco/domain';
import { elapsed, formatCost, formatTokens } from '../../lib/format';
import { STATE_LABELS, totalTokens } from '../../lib/overview';
import { lastActionOf, titleOf } from '../sessions-table';

export interface StateBoardProps {
  columns: { sessions: SessionDto[]; state: SessionStateDto }[];
  now: Date;
}

const COLUMN_TITLES: Record<SessionStateDto, string> = { ...STATE_LABELS, inactive: 'Inactives' };

/** « labo-ia/rag » : le dépôt, et le dernier dossier quand la session tourne dans un sous-dossier. */
function placeOf(session: SessionDto): string {
  if (!session.repository) return 'Hors dépôt git';
  const { folder, name } = session.repository;
  return folder ? `${name}/${folder.split('/').at(-1) ?? folder}` : name;
}

function Card({ now, session }: { now: Date; session: SessionDto }) {
  const running = session.state === 'running';
  return (
    <article className="flex flex-col gap-2 rounded-card border border-line bg-surface p-3 shadow-card">
      <p className="flex items-center gap-2 font-mono text-xs text-muted">
        <span className="truncate">{placeOf(session)}</span>
        <span className="truncate">{session.branch ?? '—'}</span>
        <span className="ml-auto tabular-nums">{elapsed(new Date(session.lastEventAt), now)}</span>
      </p>
      <h3 className="font-medium">{titleOf(session)}</h3>
      {running ? (
        <ol aria-label="Dernières actions" className="flex flex-col gap-0.5 font-mono text-xs text-muted">
          {(session.recentActions.length > 0 ? session.recentActions : [lastActionOf(session, now)]).map(
            (action, index) => (
              <li key={`${index}-${action}`} className="truncate">
                <span aria-hidden>▸ </span>
                {action}
              </li>
            ),
          )}
        </ol>
      ) : null}
      <p className="flex items-center gap-3 text-xs text-muted">
        <span>{running ? `depuis ${elapsed(new Date(session.startedAt), now)}` : 'sans événement'}</span>
        <span className="ml-auto font-mono tabular-nums">{formatTokens(totalTokens(session.usage))}</span>
        <span className="font-mono tabular-nums">{formatCost(session.cost)}</span>
      </p>
    </article>
  );
}

/** Vue d'ensemble regroupée par état (E1d) : une colonne par état ; sur téléphone, on passe d'une colonne à l'autre. */
export function StateBoard({ columns, now }: StateBoardProps) {
  return (
    <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
      {columns.map(({ sessions, state }) => (
        <section
          key={state}
          aria-label={COLUMN_TITLES[state]}
          className="flex w-72 shrink-0 snap-start flex-col gap-3 md:w-auto md:min-w-0 md:flex-1"
        >
          <h2 className="flex items-center gap-2 text-xs font-semibold text-muted">
            {COLUMN_TITLES[state]}
            <span className="badge badge-ghost font-mono badge-sm">{sessions.length}</span>
          </h2>
          {sessions.map((session) => (
            <Card key={session.id} now={now} session={session} />
          ))}
        </section>
      ))}
    </div>
  );
}
