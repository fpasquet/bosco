import { FolderGit2, Layers } from 'lucide-react';
import Link from 'next/link';
import type { SessionDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { clockOf } from '../../lib/detail';
import { actionLabel, elapsed, formatCost, formatTokens, sessions as sessionsLabel } from '../../lib/format';
import { type ProjectGroup, projectLabel, totalTokens } from '../../lib/overview';
import { SessionStateBadge } from '../session-state-badge';

export interface SessionsTableProps {
  /** Bosco injoignable : les données sont figées, « Vu à » remplace les durées (E1f, CA-SESS-23) */
  frozen?: boolean;
  groups: ProjectGroup[];
  /** Un intertitre par groupe de lignes ; par défaut, sans colonne « Dossier » ni « Projet » */
  headings?: boolean;
  /** Marque du profil (« perso ») d'une session lancée avec un autre dossier de configuration que celui par défaut */
  markOf: (session: SessionDto) => null | string;
  now: Date;
  /** Lignes animées à la suite des sessions arrivées, pendant le chargement (E1e) */
  pendingRows?: number;
  /**
   * Page d'un projet : la colonne « Dossier » remplace les intertitres ; page d'un groupe : la colonne
   * « Projet », dont le nom ouvre la page du projet
   */
  column?: 'folder' | 'project';
}

/** Projet d'une session dans la page d'un groupe : son nom ouvre sa page. */
function ProjectLink({ session }: { session: SessionDto }) {
  if (!session.project) return <span className="text-muted">Hors projet</span>;
  return (
    <Link href={`/projects/${session.project.id}/sessions`} className="relative z-10 link link-hover">
      {projectLabel(session)}
    </Link>
  );
}

export function lastActionOf(session: SessionDto, now: Date): string {
  if (session.state === 'inactive') return `Aucun événement depuis ${elapsed(new Date(session.lastEventAt), now)}`;
  return session.lastAction ? actionLabel(session.lastAction) : 'Démarrage de la session';
}

export function titleOf(session: SessionDto): string {
  return session.title ?? `Session ${session.id.slice(0, 8)}`;
}

function projectsLabel(count: number): string {
  return count > 1 ? `${count} projets` : `${count} projet`;
}

function groupLabel(group: ProjectGroup, pending: boolean): string {
  const count = sessionsLabel(group.sessions.length);
  const projects = group.group ? `${projectsLabel(group.group.projects)} · ` : '';
  return pending ? `${projects}${count} pour l’instant` : `${projects}${count}`;
}

/** Intertitre d'un groupe de lignes : son nom et ce qu'il compte ; pour un groupe, « Réglages du groupe » (E1g). */
function GroupHeading({ group, pending }: { group: ProjectGroup; pending: boolean }) {
  const Icon = group.group ? Layers : FolderGit2;
  return (
    <span className="flex items-center gap-2">
      <Icon aria-hidden className="size-3.5" />
      <b className="font-semibold text-ink">{group.name ?? 'Hors projet'}</b>
      {groupLabel(group, pending)}
      {group.group && (
        <Link href={`/groups/${group.group.id}/settings`} className="ml-auto link pr-4 link-hover">
          Réglages du groupe<span className="sr-only"> {group.name}</span>
        </Link>
      )}
    </span>
  );
}

function Row({
  also,
  column,
  frozen,
  label,
  markOf,
  now,
  session,
}: {
  also: null | string;
  column: SessionsTableProps['column'];
  frozen: boolean;
  label: null | string;
  markOf: SessionsTableProps['markOf'];
  now: Date;
  session: SessionDto;
}) {
  const inactive = session.state === 'inactive';
  const mark = markOf(session);
  return (
    <tr className={cn('relative h-row border-b border-line hover:bg-surface-alt', inactive && 'text-muted')}>
      <td className="pl-4">
        <SessionStateBadge state={session.state} still={frozen} />
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
          {label && <span className="shrink-0 font-mono text-xs text-muted">{label}</span>}
          {also && <span className="shrink-0 text-xs text-muted">{also}</span>}
        </span>
      </td>
      {column === 'folder' && (
        <td className="truncate font-mono text-xs text-muted">
          {session.project ? session.project.folder || 'racine' : '—'}
        </td>
      )}
      {column === 'project' && (
        <td className="truncate">
          <ProjectLink session={session} />
        </td>
      )}
      <td className="truncate font-mono text-xs text-muted">{session.branch ?? '—'}</td>
      <td className="truncate pr-3 text-muted">{lastActionOf(session, now)}</td>
      <td className="font-mono text-xs tabular-nums">
        {formatCost(session.cost)} · {formatTokens(totalTokens(session.usage))}
      </td>
      <td className="pr-4 text-right text-xs text-muted tabular-nums">
        {frozen ? clockOf(session.lastEventAt) : elapsed(new Date(session.lastEventAt), now)}
      </td>
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

function MobileList({ column, groups, headings, now, pendingRows }: Omit<SessionsTableProps, 'markOf'>) {
  return (
    <div className="flex flex-col gap-4 md:hidden">
      {groups.map((group) => (
        <section key={group.name ?? ''} aria-label={group.name ?? 'Hors projet'}>
          {headings && (
            <h2 className="px-1 pb-1.5 text-xs font-semibold text-muted">
              {group.name ?? 'Hors projet'}
              {group.group && ` · ${projectsLabel(group.group.projects)}`}
            </h2>
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
                    {column === 'project' && `${projectLabel(session) ?? 'Hors projet'} · `}
                    {column !== 'project' && group.labels?.[session.id] && `${group.labels[session.id]} · `}
                    {group.also?.[session.id] && `${group.also[session.id]} · `}
                    {column === 'folder' && session.project?.folder && `${session.project.folder} · `}
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

/**
 * Tableau des sessions ouvertes, groupées par projet, d'un seul projet avec ses dossiers ou d'un groupe
 * avec leur projet.
 */
export function SessionsTable({
  column,
  frozen = false,
  groups,
  headings = !column,
  markOf,
  now,
  pendingRows = 0,
}: SessionsTableProps) {
  const columns = column ? 7 : 6;
  return (
    <>
      <div className="hidden overflow-hidden rounded-card border border-line bg-surface shadow-card md:block">
        <table className="table w-full table-fixed text-left whitespace-nowrap">
          <caption className="sr-only">Sessions ouvertes</caption>
          <thead className="text-xs text-muted">
            <tr className="h-9 border-b border-line">
              <th className="w-28 pl-4 font-medium">État</th>
              <th className="font-medium">Session</th>
              {column === 'folder' && <th className="w-40 font-medium">Dossier</th>}
              {column === 'project' && <th className="w-40 font-medium">Projet</th>}
              <th className="w-32 font-medium">Branche</th>
              <th className="w-52 font-medium">Dernière action</th>
              <th className="w-32 font-medium">Coût · tokens</th>
              <th className="w-20 pr-4 text-right font-medium">{frozen ? 'Vu à' : 'Activité'}</th>
            </tr>
          </thead>
          {groups.map((group) => (
            <tbody key={group.name ?? ''}>
              {headings && (
                <tr className="h-8 border-b border-line bg-surface-alt text-xs text-muted">
                  <th colSpan={columns} scope="colgroup" className="pl-4 font-normal">
                    <GroupHeading group={group} pending={pendingRows > 0} />
                  </th>
                </tr>
              )}
              {group.sessions.map((session) => (
                <Row
                  key={session.id}
                  also={group.also?.[session.id] ?? null}
                  frozen={frozen}
                  label={group.labels?.[session.id] ?? null}
                  markOf={markOf}
                  now={now}
                  session={session}
                  column={column}
                />
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
      <MobileList groups={groups} headings={headings} now={now} pendingRows={pendingRows} column={column} />
    </>
  );
}
