import { Box, Clock, GitBranch, GitPullRequest, type LucideIcon, MessageSquare } from 'lucide-react';
import type { UsageReportDto } from '@bosco/domain';
import { formatDuration } from '../../lib/format';

interface Tile {
  icon: LucideIcon;
  label: string;
  /** Libellé plus court, sur le téléphone */
  short: string;
  value: string;
}

/**
 * Activité de Bosco (E23a) : sessions pilotées lancées, temps de travail des agents, bacs à sable créés, branches
 * récupérées et PR créées, repérées dans le fil des sessions.
 */
export function ActivityTiles({ activity }: { activity: UsageReportDto['activity'] }) {
  const tiles: Tile[] = [
    {
      icon: MessageSquare,
      label: 'Sessions pilotées lancées',
      short: 'Sessions pilotées',
      value: String(activity.pilotedSessions),
    },
    {
      icon: Clock,
      label: 'Temps de travail des agents',
      short: 'Travail des agents',
      value: formatDuration(activity.agentWorkSeconds),
    },
    { icon: Box, label: 'Bacs à sable créés', short: 'Bacs à sable', value: String(activity.sandboxes) },
    {
      icon: GitBranch,
      label: 'Branches récupérées',
      short: 'Branches récupérées',
      value: String(activity.retrievedBranches),
    },
    { icon: GitPullRequest, label: 'PR créées', short: 'PR créées', value: String(activity.pullRequests) },
  ];
  return (
    <section aria-labelledby="usage-activity" className="flex flex-col gap-2">
      <h2 id="usage-activity" className="text-sm font-semibold">
        Activité de Bosco
      </h2>
      <dl className="grid grid-cols-2 gap-2 md:grid-cols-5 md:gap-3">
        {tiles.map(({ icon: Icon, label, short, value }) => (
          <div key={label} className="flex flex-col-reverse rounded-card border border-line bg-surface p-3 shadow-card">
            <dt className="truncate text-xs text-muted">
              <span className="md:hidden">{short}</span>
              <span className="hidden md:inline">{label}</span>
            </dt>
            <dd className="flex items-center gap-3">
              <span className="hidden size-9 shrink-0 place-items-center rounded-control bg-primary-soft text-primary md:grid">
                <Icon aria-hidden className="size-4" />
              </span>
              <span className="font-display text-xl font-semibold tabular-nums">{value}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
