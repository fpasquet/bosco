// Ordre des versions et choix de la release selon le canal : les scénarios n'en jouent que quelques cas.
import { describe, expect, it } from 'vitest';
import { channelOf, isNewer, newestRelease, type PublishedRelease, releaseVersionOf } from './release.ts';

function release(version: string, prerelease = version.includes('beta')): PublishedRelease {
  return { version, prerelease, publishedAt: new Date('2026-11-20T10:00:00Z'), notes: '', url: '', assets: [] };
}

describe('versions', () => {
  it('orders betas before their stable version, and ignores the build suffix', () => {
    expect(isNewer('0.3.0', '0.3.0-beta.2')).toBe(true);
    expect(isNewer('0.3.0-beta.2', '0.3.0-beta.1')).toBe(true);
    expect(isNewer('0.3.0-beta.1', '0.2.9')).toBe(true);
    expect(isNewer('0.3.0', '0.3.0')).toBe(false);
    expect(isNewer('next', '0.1.0')).toBe(false);
    expect(releaseVersionOf('0.1.0+git20261109073400.3118cb5')).toBe('0.1.0');
    expect([channelOf('0.3.0-beta.1'), channelOf('0.3.0'), channelOf('0.1.0+git2026.3118cb5')]).toEqual([
      'beta',
      'stable',
      'stable',
    ]);
  });
});

describe('newestRelease', () => {
  const releases = [release('0.2.0'), release('0.3.0-beta.1'), release('0.1.0')];

  it('offers the newest stable on the stable channel, and a beta too on the beta channel', () => {
    expect(newestRelease(releases, 'stable', '0.1.0')?.version).toBe('0.2.0');
    expect(newestRelease(releases, 'beta', '0.1.0')?.version).toBe('0.3.0-beta.1');
  });

  it('offers nothing when the running version is the newest, build suffix ignored', () => {
    expect(newestRelease(releases, 'stable', '0.2.0+git20261120.4c2e9b1')).toBeNull();
    expect(newestRelease(releases, 'beta', '0.3.0-beta.1')).toBeNull();
  });
});
