import { FolderGit2 } from 'lucide-react';
import Link from 'next/link';
import type { SessionDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { actionLabel, elapsed, formatCost, formatTokens, sessions as sessionsLabel } from '../../lib/format';
import { type RepositoryGroup, totalTokens } from '../../lib/overview';
import { SessionStateBadge } from '../session-state-badge';

export interface SessionsTableProps {
  groups: RepositoryGroup[];
  /** Marque du profil (« perso ») d'une session lancée avec un autre dossier de configuration que celui par défaut */
  markOf: (session: SessionDto) => null | string;
  now: Date;
  /** Lignes animées à la suite des sessions arrivées, pendant le chargement (E1e) */
  pendingRows?: number;
  /** Vue filtrée sur un dépôt (E1c) : la colonne « Dossier » remplace les intertitres */
  showFolder?: boolean;
}

export function lastActionOf(session: SessionDto, now: Date): string {
  if (session.state === 'inactive') return `Aucun événement depuis ${elapsed(new Date(session.lastEventAt), now)}`;
  return session.lastAction ? actionLabel(session.lastAction) : 'Démarrage de la session';
}

export function titleOf(session: SessionDto): string {
  return session.title ?? `Session ${session.id.slice(0, 8)}`;
}

function groupLabel(group: RepositoryGroup, pending: boolean): string {
  const count = sessionsLabel(group.sessions.length);
  return pending ? `${count} pour l’instant` : count;
}

function Row({
  markOf,
  now,
  session,
  showFolder,
}: {
  markOf: SessionsTableProps['markOf'];
  now: Date;
  session: SessionDto;
  showFolder: boolean;
}) {
  const inactive = session.state === 'inactive';
  const mark = markOf(session);
  return (
    <tr className={cn('relative h-row border-b border-line hover:bg-surface-alt', inactive && 'text-muted')}>
      <td className="pl-4">
        <SessionStateBadge state={session.state} />
      </td>
      <td>
        <span className="flex items-center gap-2">
          {/* Toute la ligne ouvre le détail de la session (E1b, annotation 5) */}
          <Link
            href={`/sessions/${encodeURIComponent(session.id)}`}
            className={cn('truncate after:absolute after:inset-0', !inactive && 'font-medium')}
          >
            {titleOf(session)}
          </Link>
          {mark && (
            <span className="shrink-0 rounded-sm border border-line px-1 font-mono text-xs text-muted">{mark}</span>
          )}
        </span>
      </td>
      {showFolder && (
        <td className="truncate font-mono text-xs text-muted">
          {session.repository ? session.repository.folder || 'racine' : '—'}
        </td>
      )}
      <td className="truncate font-mono text-xs text-muted">{session.branch ?? '—'}</td>
      <td className="truncate pr-3 text-muted">{lastActionOf(session, now)}</td>
      <td className="font-mono text-xs tabular-nums">
        {formatCost(session.cost)} · {formatTokens(totalTokens(session.usage))}
      </td>
      <td className="pr-4 text-right text-xs text-muted tabular-nums">{elapsed(new Date(session.lastEventAt), now)}</td>
    </tr>
  );
}

function PendingRow({ columns }: { columns: number }) {
  return (
    <tr aria-hidden className="h-row border-b border-line">
      <td colSpan={columns} className="px-4">
        <span className="block h-4 skeleton" />
      </td>
    </tr>
  );
}

function MobileList({ groups, now, pendingRows, showFolder }: Omit<SessionsTableProps, 'markOf'>) {
  return (
    <div className="flex flex-col gap-4 md:hidden">
      {groups.map((group) => (
        <section key={group.name ?? ''} aria-label={group.name ?? 'Hors dépôt git'}>
          {!showFolder && (
            <h2 className="px-1 pb-1.5 text-xs font-semibold text-muted">{group.name ?? 'Hors dépôt git'}</h2>
          )}
          <ul className="divide-y divide-line rounded-card border border-line bg-surface">
            {group.sessions.map((session) => (
              <li key={session.id} className="relative flex items-center gap-3 px-3 py-2.5">
                <SessionStateBadge state={session.state} />
                <span className="min-w-0 flex-1">
                  <Link
                    href={`/sessions/${encodeURIComponent(session.id)}`}
                    className="block truncate font-medium after:absolute after:inset-0"
                  >
                    {titleOf(session)}
                  </Link>
                  <span className="block truncate font-mono text-xs text-muted">
                    {session.branch ?? '—'} · {lastActionOf(session, now)}
                  </span>
                </span>
                <span className="text-xs text-muted tabular-nums">{elapsed(new Date(session.lastEventAt), now)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {Array.from({ length: pendingRows ?? 0 }, (_, index) => (
        <span key={index} aria-hidden className="block h-12 skeleton" />
      ))}
    </div>
  );
}

/** Tableau des sessions ouvertes, groupées par dépôt (E1b) ou d'un seul dépôt avec ses dossiers (E1c). */
export function SessionsTable({ groups, markOf, now, pendingRows = 0, showFolder = false }: SessionsTableProps) {
  const columns = showFolder ? 7 : 6;
  return (
    <>
      <div className="hidden overflow-hidden rounded-card border border-line bg-surface shadow-card md:block">
        <table className="table w-full table-fixed text-left whitespace-nowrap">
          <caption className="sr-only">Sessions ouvertes</caption>
          <thead className="text-xs text-muted">
            <tr className="h-9 border-b border-line">
              <th className="w-28 pl-4 font-medium">État</th>
              <th className="font-medium">Session</th>
              {showFolder && <th className="w-40 font-medium">Dossier</th>}
              <th className="w-32 font-medium">Branche</th>
              <th className="w-52 font-medium">Dernière action</th>
              <th className="w-32 font-medium">Coût · tokens</th>
              <th className="w-20 pr-4 text-right font-medium">Activité</th>
            </tr>
          </thead>
          {groups.map((group) => (
            <tbody key={group.name ?? ''}>
              {!showFolder && (
                <tr className="h-8 border-b border-line bg-surface-alt text-xs text-muted">
                  <th colSpan={columns} scope="colgroup" className="pl-4 font-normal">
                    <span className="flex items-center gap-2">
                      <FolderGit2 aria-hidden className="size-3.5" />
                      <b className="font-semibold text-ink">{group.name ?? 'Hors dépôt git'}</b>
                      {groupLabel(group, pendingRows > 0)}
                    </span>
                  </th>
                </tr>
              )}
              {group.sessions.map((session) => (
                <Row key={session.id} markOf={markOf} now={now} session={session} showFolder={showFolder} />
              ))}
            </tbody>
          ))}
          {pendingRows > 0 && (
            <tbody>
              {Array.from({ length: pendingRows }, (_, index) => (
                <PendingRow key={index} columns={columns} />
              ))}
            </tbody>
          )}
        </table>
      </div>
      <MobileList groups={groups} now={now} pendingRows={pendingRows} showFolder={showFolder} />
    </>
  );
}
