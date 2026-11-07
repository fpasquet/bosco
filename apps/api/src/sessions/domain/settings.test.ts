// Ce que les scénarios ne voient pas : les bornes du seuil d'inactivité.
import { describe, expect, it } from 'vitest';
import { InvalidSetting, Settings } from './settings.ts';

describe('Settings', () => {
  it('starts with 15 minutes and the desktop notification on', () => {
    const settings = Settings.restore(null);
    expect([settings.inactivityDelayMs, settings.desktopNotifications]).toEqual([15 * 60 * 1000, true]);
  });

  it('accepts a threshold from 5 to 60 minutes only (CA-SESS-59)', () => {
    const settings = Settings.restore(null);
    settings.update({ inactivityMinutes: 60 });
    expect(() => settings.update({ inactivityMinutes: 4 })).toThrow(InvalidSetting);
    expect(() => settings.update({ inactivityMinutes: 61 })).toThrow(InvalidSetting);
    expect(settings.toSnapshot().inactivityMinutes).toBe(60);
  });
});
