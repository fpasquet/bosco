import { describe, expect, it } from 'vitest';
// Libellés de la version et choix du fichier à télécharger : les scénarios n'en montrent que deux cas.
import type { AvailableReleaseDto } from '@bosco/domain';
import { androidVersion, downloadOf, versionLabel } from './version';

const available: AvailableReleaseDto = {
  version: '0.3.0',
  publishedAt: '2026-11-20T10:00:00Z',
  notes: '',
  url: 'https://github.com/fpasquet/bosco/releases/tag/v0.3.0',
  downloads: { apk: 'apk-url', appImage: 'appimage-url', deb: 'deb-url' },
};

describe('versionLabel', () => {
  it('names a release, a beta and a build of a commit', () => {
    expect(versionLabel({ version: '0.2.0', commit: null, release: true })).toBe('0.2.0');
    expect(versionLabel({ version: '0.3.0-beta.1', commit: null, release: true })).toBe('0.3.0-beta.1 · bêta');
    expect(versionLabel({ version: '0.2.0', commit: '3118cb5', release: false })).toBe('0.2.0 · 3118cb5');
  });
});

describe('androidVersion', () => {
  it('reads the version of the Android application in its user agent', () => {
    expect(androidVersion('Mozilla/5.0 (Linux; Android 15) BoscoAndroid/0.3.0-beta.1')).toBe('0.3.0-beta.1');
    expect(androidVersion('Mozilla/5.0 (Linux; Android 15) BoscoAndroid/1.0')).toBeNull();
    expect(androidVersion('Mozilla/5.0 (X11; Linux x86_64)')).toBeNull();
  });
});

describe('downloadOf', () => {
  it('CA-REGL-35 · offers the APK on the phone, the .deb on the workstation, nothing to the AppImage', () => {
    expect(downloadOf(available, { install: 'deb', phone: true })).toEqual({
      label: 'Télécharger l’APK',
      url: 'apk-url',
    });
    expect(downloadOf(available, { install: 'deb', phone: false })).toEqual({
      label: 'Télécharger le .deb',
      url: 'deb-url',
    });
    expect(downloadOf(available, { install: 'appimage', phone: false })).toBeNull();
  });
});
