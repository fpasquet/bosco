// L'appel à GitHub : sans identifiant, avec un agent générique, brouillons écartés. Les scénarios passent par un flux
// scripté et ne l'appellent jamais.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GitHubReleaseFeed } from './github-release-feed.ts';

const URL = 'https://api.github.com/repos/fpasquet/bosco/releases?per_page=30';

afterEach(() => vi.unstubAllGlobals());

describe('GitHubReleaseFeed', () => {
  it('reads the published releases without credentials, drafts left out', async () => {
    const fetch = vi.fn((_url: string, _init: RequestInit) =>
      Promise.resolve(
        Response.json([
          {
            tag_name: 'v0.3.0-beta.1',
            draft: false,
            prerelease: true,
            published_at: '2026-11-20T10:00:00Z',
            body: '### Nouveautés',
            html_url: 'https://github.com/fpasquet/bosco/releases/tag/v0.3.0-beta.1',
            assets: [
              { name: 'bosco-desktop_0.3.0-beta.1_amd64.deb', browser_download_url: 'https://example.test/deb' },
            ],
          },
          {
            tag_name: 'v0.4.0',
            draft: true,
            prerelease: false,
            published_at: null,
            body: null,
            html_url: '',
            assets: [],
          },
        ]),
      ),
    );
    vi.stubGlobal('fetch', fetch);
    const releases = await new GitHubReleaseFeed(URL).list();
    expect(releases.map(({ prerelease, version }) => ({ prerelease, version }))).toEqual([
      { prerelease: true, version: '0.3.0-beta.1' },
    ]);
    const [, init] = fetch.mock.calls[0] ?? [];
    expect(init?.headers).toEqual({ accept: 'application/vnd.github+json', 'user-agent': 'Bosco' });
  });

  it('fails on an answer that is not a success', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('', { status: 403 })));
    await expect(new GitHubReleaseFeed(URL).list()).rejects.toThrow('GitHub answered 403');
  });
});
