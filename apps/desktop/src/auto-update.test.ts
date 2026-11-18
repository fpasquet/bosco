// Ce que l'application ne montre pas à l'œil : les préférences de mise à jour lues dans le service, et la façon dont
// elle est installée.
import { describe, expect, it } from 'vitest';
import { installKind, preferencesOf, updaterChannel } from './auto-update.ts';

describe('the updates of the AppImage', () => {
  it('CA-APPS-11 · follows the channel chosen in the settings, stable and enabled by default', () => {
    expect(preferencesOf({ updates: { channel: 'beta', enabled: false } })).toEqual({
      channel: 'beta',
      enabled: false,
    });
    expect(preferencesOf({ updates: { channel: 'nightly' } })).toEqual({ channel: 'stable', enabled: true });
    expect(preferencesOf(null)).toEqual({ channel: 'stable', enabled: true });
    expect([updaterChannel('stable'), updaterChannel('beta')]).toEqual(['latest', 'beta']);
  });

  it('tells how it is installed', () => {
    expect(installKind({ appImage: '/home/me/Bosco.AppImage', packaged: true })).toBe('appimage');
    expect(installKind({ appImage: undefined, packaged: true })).toBe('deb');
    expect(installKind({ appImage: undefined, packaged: false })).toBe('source');
  });
});
