import { describe, expect, it } from 'vitest';
import { latestOf } from './releases';

function release(tag: string, prerelease: boolean, publishedAt: string, names: string[], draft = false) {
  return {
    assets: names.map((name, index) => ({
      browser_download_url: `https://github.com/fpasquet/bosco/releases/download/${tag}/${name}`,
      name,
      size: (index + 1) * 1_000_000,
    })),
    draft,
    html_url: `https://github.com/fpasquet/bosco/releases/tag/${tag}`,
    prerelease,
    published_at: publishedAt,
    tag_name: tag,
  };
}

const FILES = (version: string) => [
  `bosco-desktop_${version}_amd64.deb`,
  `bosco-desktop_${version}_x86_64.AppImage`,
  `bosco-android-${version}.apk`,
  'latest-linux.yml',
  'SHA256SUMS',
];

describe('latestOf', () => {
  it('keeps the beta alone while no stable version is published', () => {
    const { beta, stable } = latestOf([release('v0.1.0-beta.1', true, '2026-11-18T19:26:17Z', FILES('0.1.0-beta.1'))]);
    expect(stable).toBeNull();
    expect(beta?.version).toBe('0.1.0-beta.1');
    expect(beta?.files.deb?.name).toBe('bosco-desktop_0.1.0-beta.1_amd64.deb');
    expect(beta?.files.appImage?.name).toBe('bosco-desktop_0.1.0-beta.1_x86_64.AppImage');
    expect(beta?.files.apk?.name).toBe('bosco-android-0.1.0-beta.1.apk');
    expect(beta?.files.checksums?.name).toBe('SHA256SUMS');
  });

  it('hides a beta older than the latest stable version', () => {
    const { beta, stable } = latestOf([
      release('v0.1.0', false, '2026-11-20T10:00:00Z', FILES('0.1.0')),
      release('v0.1.0-beta.1', true, '2026-11-18T19:26:17Z', FILES('0.1.0-beta.1')),
    ]);
    expect(stable?.version).toBe('0.1.0');
    expect(beta).toBeNull();
  });

  it('shows a beta newer than the latest stable version, and skips drafts', () => {
    const { beta, stable } = latestOf([
      release('v0.3.0-beta.1', true, '2026-12-03T10:00:00Z', FILES('0.3.0-beta.1'), true),
      release('v0.2.0-beta.2', true, '2026-12-02T10:00:00Z', FILES('0.2.0-beta.2')),
      release('v0.1.0', false, '2026-11-20T10:00:00Z', FILES('0.1.0')),
    ]);
    expect(stable?.version).toBe('0.1.0');
    expect(beta?.version).toBe('0.2.0-beta.2');
  });

  it('leaves a missing file null and ignores an unexpected payload', () => {
    const { stable } = latestOf([release('v0.1.0', false, '2026-11-20T10:00:00Z', ['SHA256SUMS'])]);
    expect(stable?.files.deb).toBeNull();
    expect(latestOf({ message: 'API rate limit exceeded' })).toEqual({ beta: null, stable: null });
  });
});
