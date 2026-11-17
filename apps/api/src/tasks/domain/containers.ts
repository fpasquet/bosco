// Conteneurs en cours (RF-CONT-13, DT-35) : ce que Bosco a lancé, reconnu à son nom, et ce que chacun consomme.
import { DomainError } from '../../shared/domain/domain-error.ts';

/** Agent d'une tâche, son proxy de sortie, ou un de ses services de test */
export type ContainerKind = 'agent' | 'proxy' | 'service';

export interface ContainerName {
  kind: ContainerKind;
  /** Nom du service de test ; null pour l'agent et le proxy */
  service: null | string;
  taskId: number;
}

/** Une mesure d'un conteneur de Bosco : processeur en cœurs, mémoire en octets. */
export interface ContainerSample extends ContainerName {
  cpu: number;
  image: string;
  memory: number;
  name: string;
  running: boolean;
}

/** À partir de cette part de son plafond, une jauge passe en orange : « Proche du plafond » (CA-CONT-73). */
export const NEAR_CEILING = 0.8;

/** Un conteneur resté n'est compté comme tel qu'un moment après la fin de sa tâche : le worker le supprime d'abord. */
export const LEFTOVER_GRACE_MS = 60_000;

/** Les conteneurs restés sont supprimés au démarrage, puis à cet intervalle (CA-CONT-84). */
export const LEFTOVER_CLEANUP_MS = 60 * 60_000;

/** « bosco-t12 » (agent), « bosco-t12-egress » (proxy), « bosco-t12-svc-database » (service) ; null sinon. */
export function containerNameOf(name: string): ContainerName | null {
  const match = /^bosco-t(\d+)(?:-(egress)|-svc-(.+))?$/.exec(name);
  if (!match) return null;
  const [, id, egress, service] = match;
  const taskId = Number(id);
  if (egress) return { kind: 'proxy', service: null, taskId };
  if (service) return { kind: 'service', service, taskId };
  return { kind: 'agent', service: null, taskId };
}

/** « 170.25% » de `docker stats` → 1,7025 cœur. */
export function coresOf(percent: string): number {
  const value = Number.parseFloat(percent.replace('%', ''));
  return Number.isFinite(value) ? value / 100 : 0;
}

const UNITS: Record<string, number> = {
  B: 1,
  GB: 1000 ** 3,
  GiB: 1024 ** 3,
  KiB: 1024,
  kB: 1000,
  MB: 1000 ** 2,
  MiB: 1024 ** 2,
  TB: 1000 ** 4,
  TiB: 1024 ** 4,
};

/** « 3.6GiB », « 412MiB », « 1.2GB » de Docker → octets ; 0 si illisible. */
export function bytesOf(size: string): number {
  const match = /^([\d.]+)\s*([A-Za-z]+)$/.exec(size.trim());
  if (!match) return 0;
  const [, value, unit] = match;
  return Number.parseFloat(value ?? '0') * (UNITS[unit ?? ''] ?? 0);
}

/** Valeur proche de son plafond (CA-CONT-73) ; jamais pour une valeur sans plafond (session pilotée). */
export function nearCeiling(value: number, limit: null | number): boolean {
  return limit !== null && limit > 0 && value >= limit * NEAR_CEILING;
}

/** Action sur un conteneur que Bosco ne fait pas tourner, ou pas de cette nature (service de test, conteneur resté). */
export class UnknownContainer extends DomainError {
  constructor(name: string) {
    super('unknownContainer', `No such container: ${name}`);
  }
}
