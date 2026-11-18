// Conteneurs en cours : les bacs à sable que Bosco a lancés, reconnus à leur nom, et ce que
// chacun consomme.

/** Une mesure du conteneur d'un bac à sable : processeur en cœurs, mémoire en octets. */
export interface SandboxSample {
  cpu: number;
  /** Clé du bac à sable, tirée de sa session (« bosco-s-<clé>-agent ») */
  key: string;
  memory: number;
  name: string;
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
