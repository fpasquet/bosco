// Versions de Bosco et releases publiées : laquelle proposer, selon le canal suivi.

export type UpdateChannel = 'beta' | 'stable';

interface ReleaseVersion {
  major: number;
  minor: number;
  patch: number;
  beta: null | number;
}

const PATTERN = /^v?(\d+)\.(\d+)\.(\d+)(?:-beta\.(\d+))?(?:\+[\w.]+)?$/;
/** Rang d'une stable après toutes ses betas */
const STABLE = Number.MAX_SAFE_INTEGER;

function parse(text: string): null | ReleaseVersion {
  const match = PATTERN.exec(text.trim());
  if (!match) return null;
  const [, major, minor, patch, beta] = match;
  return { major: Number(major), minor: Number(minor), patch: Number(patch), beta: beta ? Number(beta) : null };
}

/** Version sans son suffixe de construction : « 0.1.0+git20261109073400.3118cb5 » → « 0.1.0 ». */
export function releaseVersionOf(version: string): string {
  return version.replace(/^v/, '').split('+')[0] ?? version;
}

/** Une beta se reconnaît à son numéro : « 0.3.0-beta.1 ». */
export function channelOf(version: string): UpdateChannel {
  const parsed = parse(version);
  return parsed && parsed.beta !== null ? 'beta' : 'stable';
}

/** a est-elle plus récente que b ? Une version illisible ne l'est jamais. */
export function isNewer(a: string, b: string): boolean {
  const left = parse(a);
  const right = parse(b);
  if (!left || !right) return false;
  const order =
    left.major - right.major ||
    left.minor - right.minor ||
    left.patch - right.patch ||
    (left.beta ?? STABLE) - (right.beta ?? STABLE);
  return order > 0;
}

/** Une release publiée sur GitHub, telle que Bosco la propose. */
export interface PublishedRelease {
  version: string;
  prerelease: boolean;
  publishedAt: Date;
  notes: string;
  url: string;
  assets: { name: string; url: string }[];
}

/**
 * La release à proposer : la plus récente du canal (une stable sur le canal stable, une stable ou une beta sur le
 * canal beta), si elle est plus récente que la version qui tourne.
 */
export function newestRelease(
  releases: readonly PublishedRelease[],
  channel: UpdateChannel,
  running: string,
): null | PublishedRelease {
  let newest: null | PublishedRelease = null;
  for (const release of releases) {
    if (!parse(release.version)) continue;
    if (channel === 'stable' && (release.prerelease || channelOf(release.version) === 'beta')) continue;
    if (!isNewer(release.version, releaseVersionOf(running))) continue;
    if (!newest || isNewer(release.version, newest.version)) newest = release;
  }
  return newest;
}

/** Les fichiers d'une release qu'on télécharge à la main : le paquet .deb, l'AppImage et l'APK. */
export function downloadsOf(release: PublishedRelease): {
  apk: null | string;
  appImage: null | string;
  deb: null | string;
} {
  const find = (suffix: string) => release.assets.find(({ name }) => name.endsWith(suffix))?.url ?? null;
  return { apk: find('.apk'), appImage: find('.AppImage'), deb: find('.deb') };
}
