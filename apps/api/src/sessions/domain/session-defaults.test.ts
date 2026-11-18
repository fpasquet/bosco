// Ce que les scénarios ne voient pas : chaque niveau de la cascade, un à un, et les cas rares (profil réglé mais plus
// surveillé, bac à sable dont le profil Claude Code règle le mode, rien de réglé nulle part).
import { describe, expect, it } from 'vitest';
import { NO_DEFAULTS, type SessionDefaults } from '../../shared/domain/session-settings.ts';
import { resolveProfile, resolveSettings, type SettingsLevels, settingsOf } from './session-defaults.ts';

const PRO = '/home/camille/.claude';
const PERSO = '/home/camille/.claude-perso';

const set = (defaults: Partial<SessionDefaults>): SessionDefaults => ({ ...NO_DEFAULTS, ...defaults });

/** Le fil rouge : le groupe règle le mode, le projet le modèle et l'effort, le profil pro « Demander ». */
const CLUB: SettingsLevels = {
  chosen: NO_DEFAULTS,
  claude: set({ model: 'claude-sonnet-5-5', effort: 'medium' }),
  group: { name: 'Club des Trois Lacs', defaults: set({ permissionMode: 'auto' }) },
  project: { name: 'api-tarifs', defaults: set({ model: 'claude-sonnet-5-5', effort: 'high' }) },
  profile: { name: 'pro', defaults: set({ permissionMode: 'ask' }) },
  sandboxed: false,
};

describe('resolveProfile', () => {
  const levels = {
    available: [PRO, PERSO],
    chosen: null,
    defaultProfile: PRO,
    group: { name: 'Club des Trois Lacs', profile: PERSO },
    project: { name: 'api-tarifs', profile: PRO },
  };

  it('CA-SESS-156 · takes the session, then the group, then the project, then the default profile', () => {
    expect(resolveProfile({ ...levels, chosen: PRO })).toEqual({ value: PRO, origin: { level: 'session' } });
    expect(resolveProfile(levels)).toEqual({ value: PERSO, origin: { level: 'group', name: 'Club des Trois Lacs' } });
    expect(resolveProfile({ ...levels, group: null })).toEqual({
      value: PRO,
      origin: { level: 'project', name: 'api-tarifs' },
    });
    expect(resolveProfile({ ...levels, group: null, project: null })).toEqual({
      value: PRO,
      origin: { level: 'defaultProfile' },
    });
  });

  it('passes over a profile that is no longer watched, down to the first one left', () => {
    expect(resolveProfile({ ...levels, available: [PERSO], group: null, defaultProfile: PRO })).toEqual({
      value: PERSO,
      origin: { level: 'none' },
    });
    expect(resolveProfile({ ...levels, available: [] }).value).toBeNull();
  });
});

describe('resolveSettings', () => {
  it('CA-SESS-164 · takes the mode of the group, the model and the effort of the principal project', () => {
    const resolved = resolveSettings(CLUB);
    expect(resolved.permissionMode).toEqual({ value: 'auto', origin: { level: 'group', name: 'Club des Trois Lacs' } });
    expect(resolved.model).toEqual({ value: 'claude-sonnet-5-5', origin: { level: 'project', name: 'api-tarifs' } });
    expect(resolved.effort).toEqual({ value: 'high', origin: { level: 'project', name: 'api-tarifs' } });
  });

  it('CA-SESS-160 · lets the choice of the session win over every level', () => {
    const resolved = resolveSettings({ ...CLUB, chosen: set({ permissionMode: 'plan', effort: 'low' }) });
    expect(settingsOf(resolved)).toEqual({ permissionMode: 'plan', model: 'claude-sonnet-5-5', effort: 'low' });
    expect(resolved.permissionMode.origin).toEqual({ level: 'session' });
  });

  it('CA-REGL-20 · falls back on the profile set in Bosco, then on what the Claude Code profile says', () => {
    const resolved = resolveSettings({ ...CLUB, group: null, project: null });
    expect(resolved.permissionMode).toEqual({ value: 'ask', origin: { level: 'profile', name: 'pro' } });
    expect(resolved.model).toEqual({ value: 'claude-sonnet-5-5', origin: { level: 'claudeProfile' } });
    expect(resolved.effort).toEqual({ value: 'medium', origin: { level: 'claudeProfile' } });
  });

  it('asks for every permission when nothing sets the mode, and leaves the model to Claude Code', () => {
    const resolved = resolveSettings({ ...CLUB, claude: NO_DEFAULTS, group: null, project: null, profile: null });
    expect(settingsOf(resolved)).toEqual({ permissionMode: 'ask', model: null, effort: null });
    expect(resolved.model.origin).toEqual({ level: 'claudeProfile' });
  });

  it('CA-SESS-161 · accepts the edits in a sandbox when no level of Bosco sets the mode, whatever Claude Code says', () => {
    const resolved = resolveSettings({
      ...CLUB,
      claude: set({ permissionMode: 'plan' }),
      group: null,
      profile: null,
      sandboxed: true,
    });
    expect(resolved.permissionMode).toEqual({ value: 'acceptEdits', origin: { level: 'sandbox' } });
  });

  it('CA-SESS-162 · keeps a mode set by a level in a sandbox, full access included', () => {
    const resolved = resolveSettings({
      ...CLUB,
      group: { name: 'Club des Trois Lacs', defaults: set({ permissionMode: 'bypassPermissions' }) },
      sandboxed: true,
    });
    expect(resolved.permissionMode.value).toBe('bypassPermissions');
  });
});
