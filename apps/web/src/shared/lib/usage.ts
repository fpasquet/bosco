import type { UsageDto } from '@bosco/domain';

// Consommation d'un conteneur ou d'un tour, lue par les conteneurs en cours et par la carte du bac à sable d'une session

const GIGABYTE = 1024 ** 3;
const MEGABYTE = 1024 ** 2;
const ONE = new Intl.NumberFormat('fr', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const ROUND = new Intl.NumberFormat('fr', { maximumFractionDigits: 0 });
const UP_TO_ONE = new Intl.NumberFormat('fr', { maximumFractionDigits: 1 });

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
