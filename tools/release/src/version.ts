// Version d'une release : calculée depuis les commits (git-cliff) ou donnée à la main, sur le canal stable ou beta.

export type Channel = 'beta' | 'stable';

export interface Version {
  major: number;
  minor: number;
  patch: number;
  /** Numéro de la beta (« 0.3.0-beta.2 » → 2) ; null pour une version stable */
  beta: null | number;
}

const PATTERN = /^v?(\d+)\.(\d+)\.(\d+)(?:-beta\.(\d+))?$/;

export class InvalidVersion extends Error {
  constructor(text: string) {
    super(`Not a release version (X.Y.Z or X.Y.Z-beta.N): ${text}`);
  }
}

export function parseVersion(text: string): Version {
  const match = PATTERN.exec(text.trim());
  if (!match) throw new InvalidVersion(text);
  const [, major, minor, patch, beta] = match;
  return { major: Number(major), minor: Number(minor), patch: Number(patch), beta: beta ? Number(beta) : null };
}

export function formatVersion({ beta, major, minor, patch }: Version): string {
  const suffix = beta === null ? '' : `-beta.${beta}`;
  return `${major}.${minor}.${patch}${suffix}`;
}

/** Rang d'une stable après toutes ses betas */
const STABLE = Number.MAX_SAFE_INTEGER;

/** Ordre des versions : une beta passe avant la stable du même numéro. */
export function compareVersions(a: Version, b: Version): number {
  return a.major - b.major || a.minor - b.minor || a.patch - b.patch || (a.beta ?? STABLE) - (b.beta ?? STABLE);
}

export interface VersionPlan {
  channel: Channel;
  /** Version demandée dans le workflow ; vide : calculée depuis les commits */
  requested: string;
  /** Prochaine version stable selon les commits depuis la dernière stable (git-cliff --bumped-version) */
  bumped: string;
  /** Étiquettes déjà posées (v0.2.0, v0.3.0-beta.1…) */
  tags: readonly string[];
}

export class VersionAlreadyReleased extends Error {
  constructor(version: string) {
    super(`Version ${version} is not newer than the last release`);
  }
}

/**
 * Version de la release : la stable est celle des commits (ou celle demandée) ; une beta en est la beta suivante,
 * « 0.3.0-beta.1 » puis « 0.3.0-beta.2 ». Elle doit dépasser toute version déjà étiquetée.
 */
export function planVersion({ bumped, channel, requested, tags }: VersionPlan): string {
  const released = tags.flatMap((tag) => (PATTERN.test(tag) ? [parseVersion(tag)] : []));
  const asked = requested.trim() ? parseVersion(requested) : null;
  const base = asked ?? parseVersion(bumped);
  let next: Version;
  if (channel === 'stable') {
    if (base.beta !== null) throw new InvalidVersion(`${requested} (a stable release has no beta number)`);
    next = base;
  } else if (base.beta === null) {
    const betas = released.filter(
      (version) =>
        version.beta !== null &&
        version.major === base.major &&
        version.minor === base.minor &&
        version.patch === base.patch,
    );
    next = { ...base, beta: Math.max(0, ...betas.map((version) => version.beta ?? 0)) + 1 };
  } else {
    next = base;
  }
  if (released.some((version) => compareVersions(version, next) >= 0))
    throw new VersionAlreadyReleased(formatVersion(next));
  return formatVersion(next);
}

export class VersionOutOfRange extends Error {
  constructor(version: string) {
    super(`Version ${version} does not fit an Android versionCode (minor and patch below 100, beta below 99)`);
  }
}

/**
 * versionCode Android, toujours croissant : 0.3.0-beta.1 → 30001, 0.3.0 → 30099, 0.3.1-beta.1 → 30101. Une stable
 * passe après ses betas, dont le numéro reste sous 99.
 */
export function versionCode(text: string): number {
  const version = parseVersion(text);
  const { beta, major, minor, patch } = version;
  if (minor >= 100 || patch >= 100 || (beta !== null && (beta < 1 || beta >= 99))) throw new VersionOutOfRange(text);
  return major * 1_000_000 + minor * 10_000 + patch * 100 + (beta ?? 99);
}
