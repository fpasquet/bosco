import { GITHUB_URL } from './constants';

/** Page des releases, et repli quand l'API de GitHub ne répond pas au build */
export const RELEASES_URL = `${GITHUB_URL}/releases`;
export const LATEST_RELEASE_URL = `${RELEASES_URL}/latest`;

const API_URL = 'https://api.github.com/repos/fpasquet/bosco/releases?per_page=30';

export interface ReleaseFile {
  name: string;
  size: number;
  url: string;
}

export interface Release {
  /** Paquet .deb, AppImage, APK et sommes de contrôle ; un fichier absent de la release reste null */
  files: {
    apk: null | ReleaseFile;
    appImage: null | ReleaseFile;
    checksums: null | ReleaseFile;
    deb: null | ReleaseFile;
  };
  prerelease: boolean;
  publishedAt: string;
  url: string;
  version: string;
}

export interface LatestReleases {
  /** Dernière beta, seulement si elle est plus récente que la dernière version stable */
  beta: null | Release;
  stable: null | Release;
}

const PATTERNS = {
  apk: /^bosco-android-.+\.apk$/,
  appImage: /^bosco-desktop_.+\.AppImage$/,
  checksums: /^SHA256SUMS$/,
  deb: /^bosco-desktop_.+_amd64\.deb$/,
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function fileOf(value: unknown): null | ReleaseFile {
  if (!isRecord(value)) return null;
  const { browser_download_url: url, name, size } = value;
  if (typeof name !== 'string' || typeof url !== 'string' || typeof size !== 'number') return null;
  return { name, size, url };
}

function releaseOf(value: unknown): null | Release {
  if (!isRecord(value) || value.draft === true) return null;
  const { assets, html_url: url, prerelease, published_at: publishedAt, tag_name: tag } = value;
  if (typeof tag !== 'string' || typeof url !== 'string' || typeof publishedAt !== 'string') return null;
  const files = (Array.isArray(assets) ? assets : []).map(fileOf).filter((file) => file !== null);
  const find = (pattern: RegExp) => files.find(({ name }) => pattern.test(name)) ?? null;
  return {
    files: {
      apk: find(PATTERNS.apk),
      appImage: find(PATTERNS.appImage),
      checksums: find(PATTERNS.checksums),
      deb: find(PATTERNS.deb),
    },
    prerelease: prerelease === true,
    publishedAt,
    url,
    version: tag.replace(/^v/, ''),
  };
}

/** Garde la dernière version stable et la dernière beta plus récente qu'elle, dans l'ordre de l'API (récentes d'abord). */
export function latestOf(payload: unknown): LatestReleases {
  const releases = (Array.isArray(payload) ? payload : []).map(releaseOf).filter((release) => release !== null);
  const stable = releases.find((release) => !release.prerelease) ?? null;
  const beta = releases.find((release) => release.prerelease) ?? null;
  const newer = beta && (!stable || Date.parse(beta.publishedAt) > Date.parse(stable.publishedAt));
  return { beta: newer ? beta : null, stable };
}

/**
 * Lit les releases au build : l'export statique fige les liens, et le workflow Docs reconstruit le site après chaque
 * release. Sans réseau ou sans réponse de l'API, le site renvoie à la page des releases.
 */
export async function latestReleases(): Promise<LatestReleases> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  // Jeton facultatif (GITHUB_TOKEN du workflow) : sans lui, l'API limite les appels par adresse
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const response = await fetch(API_URL, { headers, signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return { beta: null, stable: null };
    return latestOf(await response.json());
  } catch {
    return { beta: null, stable: null };
  }
}
