import type { UsageDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { coresOf, memoryUsageOf, nearCeiling } from '../../lib/containers';

/** Part d'une valeur dans son plafond, en pour cent, bornée */
function percentOf(value: number, limit: number): number {
  return Math.min(100, Math.max(0, (value / limit) * 100));
}

/**
 * Processeur ou mémoire d'un élément : une jauge contre son plafond, orange à partir de 80 %, et la valeur à côté. Un
 * tour sur le poste n'a pas de plafond : sa valeur s'affiche seule.
 */
export function UsageGauge({
  frozen = false,
  kind,
  usage,
}: {
  /** Dernières mesures d'un Docker muet : grisées, sans alerte */
  frozen?: boolean;
  kind: 'cpu' | 'memory';
  usage: UsageDto;
}) {
  const limit = kind === 'cpu' ? usage.cpuLimit : usage.memoryLimit;
  const value = kind === 'cpu' ? usage.cpu : usage.memory;
  const text = kind === 'cpu' ? coresOf(usage) : memoryUsageOf(usage);
  const near = !frozen && nearCeiling(usage)[kind];
  return (
    <div className="flex items-center gap-2">
      {limit !== null && (
        <div
          role="meter"
          aria-label={`${kind === 'cpu' ? 'Processeur' : 'Mémoire'} : ${text}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(percentOf(value, limit))}
          className="relative h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-surface-alt"
        >
          <span
            className={cn('absolute inset-y-0 left-0 rounded-full', near ? 'bg-warning' : 'bg-primary')}
            style={{ width: `${percentOf(value, limit)}%` }}
          />
        </div>
      )}
      <span className={cn('font-mono text-xs whitespace-nowrap tabular-nums', near && 'text-warning')}>{text}</span>
    </div>
  );
}
