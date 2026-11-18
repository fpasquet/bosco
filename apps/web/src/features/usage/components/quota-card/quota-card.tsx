import { Hand, Settings, SquareTerminal } from 'lucide-react';
import Link from 'next/link';
import type { QuotaDto, QuotaWindowDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { displayPath } from '@/lib/format';

export interface QuotaCardProps {
  /** Dossier personnel, pour écrire les profils comme dans le terminal */
  home: string;
  quota: QuotaDto;
}

const CLOCK = new Intl.DateTimeFormat('fr', { hour: '2-digit', minute: '2-digit' });
const DAY = new Intl.DateTimeFormat('fr', { day: 'numeric', month: 'short', weekday: 'short' });

function resetLabel(window: QuotaWindowDto, week: boolean): string {
  const at = new Date(window.resetsAt);
  return week ? `remise à zéro ${DAY.format(at)} à ${CLOCK.format(at)}` : `remise à zéro à ${CLOCK.format(at)}`;
}

/** Une fenêtre du quota : sa part utilisée, ses deux repères, en orange au-delà du seuil d'attente. */
function Gauge({
  label,
  thresholds,
  week,
  window,
}: {
  label: string;
  thresholds: { stop: number; wait: number };
  week: boolean;
  window: null | QuotaWindowDto;
}) {
  const usage = window?.usage ?? 0;
  const held = window !== null && usage >= thresholds.wait;
  const value = window ? `${usage} %` : 'pas encore lu';
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
        <b className="font-medium">{label}</b>
        <span className="font-mono tabular-nums">{value}</span>
        <span className="text-xs text-muted">
          {window ? resetLabel(window, week) : 'lu au premier tour d’une session'}
        </span>
      </p>
      <div
        role="meter"
        aria-label={`${label} : ${value}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={usage}
        className="relative h-2 rounded-full bg-surface-alt"
      >
        <span
          className={cn('absolute inset-y-0 left-0 rounded-full', held ? 'bg-warning' : 'bg-primary')}
          style={{ width: `${Math.min(100, usage)}%` }}
        />
        {[thresholds.wait, thresholds.stop].map((threshold) => (
          <span
            key={threshold}
            aria-hidden
            className="absolute -inset-y-1 w-px bg-line-strong"
            style={{ left: `${threshold}%` }}
          />
        ))}
      </div>
      <div aria-hidden className="relative h-4 font-mono text-xs text-muted">
        {[thresholds.wait, thresholds.stop].map((threshold) => (
          <span key={threshold} className="absolute -translate-x-1/2" style={{ left: `${threshold}%` }}>
            {threshold} %
          </span>
        ))}
      </div>
      {held && (
        <p className="flex items-center gap-1.5 text-xs text-warning">
          <Hand aria-hidden className="size-3.5" />
          Les messages aux sessions retenues attendent
        </p>
      )}
    </div>
  );
}

/**
 * Quota des abonnements (E23a) : une ligne par abonnement, la fenêtre de 5 h et la semaine telles que Claude Code les
 * donne à chaque tour, avec les seuils d'attente et d'arrêt. Il ne se filtre pas : il vaut pour tout l'abonnement.
 */
export function QuotaCard({ home, quota }: QuotaCardProps) {
  const { thresholds } = quota;
  return (
    <section aria-labelledby="usage-quota" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 id="usage-quota" className="text-sm font-semibold">
          Quota des abonnements
        </h2>
        <span className="text-xs text-muted">Le quota ne se filtre pas : il vaut pour tout l’abonnement.</span>
        <span className="ml-auto flex items-center gap-3 text-xs text-muted">
          <span>Repères : seuil d’attente, seuil d’arrêt</span>
          <Link href="/settings/subscription" className="inline-flex link items-center gap-1 link-hover">
            <Settings aria-hidden className="size-3.5" />
            Seuils
          </Link>
        </span>
      </div>
      <div className="divide-y divide-line rounded-card border border-line bg-surface shadow-card">
        {quota.subscriptions.length === 0 && (
          <p className="p-4 text-sm text-muted">
            Aucun abonnement lu : il le sera au premier tour d’une session pilotée.
          </p>
        )}
        {quota.subscriptions.map((subscription) => (
          <div key={subscription.path} className="flex flex-col gap-4 p-4 md:flex-row md:items-start md:gap-8">
            <div className="w-40 shrink-0">
              <p className="flex items-center gap-1.5 font-medium">
                <SquareTerminal aria-hidden className="size-4 text-muted" />
                {subscription.label}
              </p>
              <p className="truncate font-mono text-xs text-muted">{displayPath(subscription.path, home)}</p>
            </div>
            <Gauge label="5 h" thresholds={thresholds.fiveHour} week={false} window={subscription.fiveHour} />
            <Gauge label="Semaine" thresholds={thresholds.sevenDay} week window={subscription.sevenDay} />
          </div>
        ))}
      </div>
    </section>
  );
}
