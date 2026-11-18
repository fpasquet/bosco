// Conteneurs en cours : les bacs à sable que Bosco a lancés, reconnus à leur nom, et ce que
// chacun consomme.

/** Une mesure d'un conteneur d'un bac à sable : processeur en cœurs, mémoire en octets. */
export interface SandboxSample {
  cpu: number;
  /** Clé du bac à sable, tirée de sa session (« bosco-s-<clé>-agent ») */
  key: string;
  memory: number;
  name: string;
  /** Service de données du projet ; null pour le conteneur de l'agent */
  service: null | { image: string; name: string; state: 'failed' | 'ready' | 'starting' };
  /** Création du conteneur ; null si Docker ne la donne pas */
  since: Date | null;
}

/** « 2026-11-18 15:43:54 +0100 CET » de `docker ps` → la date ; null si illisible. */
export function dockerDateOf(text: string): Date | null {
  const match = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([+-]\d{2})(\d{2})/.exec(text.trim());
  if (!match) return null;
  const [, day, time, hours, minutes] = match;
  const date = new Date(`${day}T${time}${hours}:${minutes}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** « Up 3 minutes (healthy) » de `docker ps` → l'état d'un service de données. */
export function serviceStateOf(status: string): 'failed' | 'ready' | 'starting' {
  if (!status.startsWith('Up')) return 'failed';
  if (status.includes('(unhealthy)')) return 'failed';
  return status.includes('(health: starting)') ? 'starting' : 'ready';
}

/** À partir de cette part de son plafond, une jauge passe en orange : « Proche du plafond ». */
export const NEAR_CEILING = 0.8;

/** « bosco-s-7ad7871f65c1-agent » → « 7ad7871f65c1 » ; null pour un autre conteneur (le proxy compris). */
export function sandboxKeyOf(name: string): null | string {
  return /^bosco-s-([a-z0-9]+)-agent$/.exec(name)?.[1] ?? null;
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

/** Valeur proche de son plafond ; jamais pour une valeur sans plafond (tour piloté sur le poste). */
export function nearCeiling(value: number, limit: null | number): boolean {
  return limit !== null && limit > 0 && value >= limit * NEAR_CEILING;
}
