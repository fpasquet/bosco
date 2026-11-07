import type { OverviewIndicators as Indicators } from '../../lib/overview';
import { elapsed, formatCost } from '../../lib/format';

function Tile({
  detail,
  label,
  live = false,
  value,
}: {
  detail?: string;
  label: string;
  live?: boolean;
  value: string;
}) {
  return (
    <div className="px-4 py-2.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 flex items-baseline gap-2">
        <span className="font-display text-xl font-semibold tabular-nums">{value}</span>
        {live && <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-info" />}
        {detail && <span className="text-xs text-muted">{detail}</span>}
      </dd>
    </div>
  );
}

/** « 8 terminées » ; rien tant qu'aucune session du jour n'est terminée. */
function endedLabel(count: number): string | undefined {
  if (count === 0) return undefined;
  return `${count} ${count > 1 ? 'terminées' : 'terminée'}`;
}

/** Bande d'indicateurs de la vue d'ensemble ; le coût du jour est une estimation au tarif public (RF-SESS-05). */
export function OverviewIndicators({ indicators, now }: { indicators: Indicators; now: Date }) {
  const { costToday, endedToday, inactive, inactiveSince, running, sessionsToday } = indicators;
  return (
    <dl className="grid grid-cols-2 divide-line rounded-card border border-line bg-surface shadow-card md:grid-cols-4 md:divide-x">
      <Tile label="En cours" value={String(running)} live={running > 0} />
      <Tile
        label="Inactives"
        value={String(inactive)}
        detail={inactiveSince ? `depuis ${elapsed(inactiveSince, now)}` : undefined}
      />
      <Tile label="Sessions aujourd’hui" value={String(sessionsToday)} detail={endedLabel(endedToday)} />
      <Tile
        label="Coût du jour"
        value={formatCost({ ...costToday, unpriced: false })}
        detail={costToday.unpriced ? 'estimé · une part non chiffrée' : 'estimé'}
      />
    </dl>
  );
}
