import type { ContainersDto, UsageDto } from '@bosco/domain';

const GIGABYTE = 1024 ** 3;
const MEGABYTE = 1024 ** 2;
const ONE = new Intl.NumberFormat('fr', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const ROUND = new Intl.NumberFormat('fr', { maximumFractionDigits: 0 });
const UP_TO_ONE = new Intl.NumberFormat('fr', { maximumFractionDigits: 1 });

/** À partir de cette part de son plafond, la valeur passe en orange (CA-CONT-73). */
export const NEAR_CEILING = 0.8;

/** « 3,6 Go », « 4 Go », « 412 Mo » */
export function memoryOf(bytes: number): string {
  return bytes >= GIGABYTE ? `${UP_TO_ONE.format(bytes / GIGABYTE)} Go` : `${ROUND.format(bytes / MEGABYTE)} Mo`;
}

/** « 4 Go » pour un plafond rond, sinon comme memoryOf */
function limitOf(bytes: number): string {
  return bytes >= GIGABYTE && bytes % GIGABYTE === 0 ? `${bytes / GIGABYTE} Go` : memoryOf(bytes);
}

/** « 1,7 / 2 cœurs », « 0,3 cœur » sans plafond */
export function coresOf({ cpu, cpuLimit }: Pick<UsageDto, 'cpu' | 'cpuLimit'>): string {
  const value = ONE.format(cpu);
  if (cpuLimit === null) return `${value} ${cpu >= 2 ? 'cœurs' : 'cœur'}`;
  return `${value} / ${ROUND.format(cpuLimit)} ${cpuLimit >= 2 ? 'cœurs' : 'cœur'}`;
}

/** « 3,6 / 4 Go », « 410 Mo » sans plafond */
export function memoryUsageOf({ memory, memoryLimit }: Pick<UsageDto, 'memory' | 'memoryLimit'>): string {
  if (memoryLimit === null) return memoryOf(memory);
  if (memory >= GIGABYTE) return `${ONE.format(memory / GIGABYTE)} / ${limitOf(memoryLimit)}`;
  return `${memoryOf(memory)} / ${limitOf(memoryLimit)}`;
}

/** Processeur ou mémoire à 80 % ou plus de son plafond : « Proche du plafond » (CA-CONT-73). */
export function nearCeiling(usage: UsageDto): { cpu: boolean; memory: boolean } {
  return {
    cpu: usage.cpuLimit !== null && usage.cpu >= usage.cpuLimit * NEAR_CEILING,
    memory: usage.memoryLimit !== null && usage.memory >= usage.memoryLimit * NEAR_CEILING,
  };
}

/** Quelque chose tourne : le résumé de la barre latérale apparaît (CA-CONT-70) ; Docker muet aussi (CA-CONT-80). */
export function somethingRuns(view: ContainersDto | undefined): boolean {
  if (!view) return false;
  return view.unreachableSince !== null || view.agents.length > 0 || view.piloted.length > 0;
}

/** « 2 agents · 3 services · 1 session » */
export function countsOf({ totals }: Pick<ContainersDto, 'totals'>, leftovers = 0): string {
  const plural = (count: number, one: string, many: string) => `${count} ${count > 1 ? many : one}`;
  return [
    plural(totals.agents, 'agent', 'agents'),
    totals.services > 0 ? plural(totals.services, 'service', 'services') : null,
    totals.piloted > 0 ? plural(totals.piloted, 'session', 'sessions') : null,
    leftovers > 0 ? plural(leftovers, 'resté', 'restés') : null,
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
