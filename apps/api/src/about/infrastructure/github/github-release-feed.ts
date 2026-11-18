import { z } from 'zod';
import type { ReleaseFeed } from '../../application/ports.ts';
import type { PublishedRelease } from '../../domain/release.ts';

const releasesSchema = z.array(
  z.object({
    tag_name: z.string(),
    draft: z.boolean(),
    prerelease: z.boolean(),
    published_at: z.string().nullable(),
    body: z.string().nullable(),
    html_url: z.string(),
    assets: z.array(z.object({ name: z.string(), browser_download_url: z.string() })),
  }),
);

/** Délai d'un appel à GitHub : au-delà, la recherche échoue et réessaie le lendemain */
const TIMEOUT_MS = 15_000;

/**
 * Releases publiées du dépôt de Bosco, par l'API publique de GitHub : un GET sans identifiant ni cookie, avec un agent
 * utilisateur générique. Les brouillons sont écartés.
 */
export class GitHubReleaseFeed implements ReleaseFeed {
  constructor(private readonly url: string) {}

  async list(): Promise<PublishedRelease[]> {
    const response = await fetch(this.url, {
      headers: { accept: 'application/vnd.github+json', 'user-agent': 'Bosco' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
    const body: unknown = await response.json();
    const releases = releasesSchema.parse(body);
    return releases
      .filter((release) => !release.draft)
      .map((release) => ({
        version: release.tag_name.replace(/^v/, ''),
        prerelease: release.prerelease,
        publishedAt: new Date(release.published_at ?? 0),
        notes: release.body ?? '',
        url: release.html_url,
        assets: release.assets.map(({ browser_download_url, name }) => ({ name, url: browser_download_url })),
      }));
  }
}
