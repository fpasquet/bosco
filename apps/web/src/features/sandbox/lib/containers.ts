import type { ContainersDto, UsageDto } from '@bosco/domain';

/** À partir de cette part de son plafond, la valeur passe en orange. */
export const NEAR_CEILING = 0.8;

export { coresOf, memoryOf, memoryUsageOf } from '@/shared/lib/usage';

/** Processeur ou mémoire à 80 % ou plus de son plafond : « Proche du plafond ». */
export function nearCeiling(usage: UsageDto): { cpu: boolean; memory: boolean } {
  return {
    cpu: usage.cpuLimit !== null && usage.cpu >= usage.cpuLimit * NEAR_CEILING,
    memory: usage.memoryLimit !== null && usage.memory >= usage.memoryLimit * NEAR_CEILING,
  };
}

/** Quelque chose tourne : le résumé de la barre latérale apparaît ; Docker muet aussi. */
export function somethingRuns(view: ContainersDto | undefined): boolean {
  if (!view) return false;
  return view.unreachableSince !== null || view.sandboxes.length > 0 || view.piloted.length > 0;
}

/** « 2 bacs à sable · 1 tour sur le poste » */
export function countsOf({ totals }: Pick<ContainersDto, 'totals'>): string {
  const plural = (count: number, one: string, many: string) => `${count} ${count > 1 ? many : one}`;
  return [
    totals.sandboxes > 0 || totals.piloted === 0 ? plural(totals.sandboxes, 'bac à sable', 'bacs à sable') : null,
    totals.piloted > 0 ? plural(totals.piloted, 'tour sur le poste', 'tours sur le poste') : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** « il y a 2 s », « il y a 3 min », puis l'heure : « à 15:13 » */
export function agoOf(iso: string, now: number): string {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `il y a ${seconds} s`;
  if (seconds < 3600) return `il y a ${Math.round(seconds / 60)} min`;
  return `à ${timeOf(iso)}`;
}

/** « 15:09 » */
export function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' });
}
