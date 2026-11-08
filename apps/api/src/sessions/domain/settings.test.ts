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

describe('Settings of the discovered repositories (E4d)', () => {
  it('starts with git only, worktrees attached and /tmp excluded', () => {
    expect(Settings.restore(null).repositories).toEqual({
      attachWorktrees: true,
      excluded: ['/tmp'],
      gitOnly: true,
      hidden: [],
      roots: [],
    });
  });

  it('changes one setting at a time, folders written as in the terminal and without duplicates', () => {
    const settings = Settings.restore(null);
    settings.update({ repositories: { roots: ['~/www/', '~/www'] } });
    expect(settings.repositories).toMatchObject({ excluded: ['/tmp'], gitOnly: true, roots: ['~/www'] });
    expect(() => settings.update({ repositories: { excluded: ['archives'] } })).toThrow(InvalidSetting);
  });
});
