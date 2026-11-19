import { describe, expect, it } from 'vitest';
import {
  effortLabel,
  effortOptions,
  modelLabel,
  modelOptions,
  modelValue,
  permissionLabel,
  permissionMode,
  permissionOptions,
  spokenLabel,
  withPermissionMode,
} from './settings-options';

const NONE = { effort: null, model: null, permissionMode: null };
const DEFAULTS = {
  effort: { origin: 'défaut du projet maison', value: 'high' },
  model: { origin: null, value: 'opus' },
  permissionMode: { origin: 'défaut en bac à sable', value: 'acceptEdits' },
};

describe('settings options', () => {
  it('checks « Défaut : Opus 5.5 » until a model or an effort is chosen', () => {
    expect(modelLabel(NONE, DEFAULTS.model)).toBe('Défaut : Opus 5.5');
    expect(modelValue(NONE)).toBe('default');
    expect(modelOptions(DEFAULTS.model)[0]).toEqual({ value: 'default', label: 'Défaut : Opus 5.5' });
    expect(effortLabel(NONE, DEFAULTS.effort)).toBe('Défaut : effort élevé');
    expect(effortOptions(DEFAULTS.effort)[0]).toEqual({
      value: 'default',
      label: 'Défaut : élevé',
      description: 'défaut du projet maison',
    });
  });

  it('names the chosen value, or « Défaut » alone when the default value is unknown', () => {
    const chosen = { ...NONE, effort: 'low', model: 'claude-haiku-4-5' } as const;
    expect(modelLabel(chosen, DEFAULTS.model)).toBe('Haiku 4.5');
    expect(effortLabel(chosen, DEFAULTS.effort)).toBe('Effort : faible');
    expect(modelLabel(NONE)).toBe('Défaut');
    expect(effortLabel(NONE)).toBe('Effort : défaut');
    expect(modelOptions()[0]).toEqual({ value: 'default', label: 'Défaut' });
  });

  it('checks « Défaut : Demander » for the permissions of a new session, none for a started one', () => {
    expect(permissionLabel(NONE, DEFAULTS.permissionMode)).toBe('Défaut : Accepter les modifications');
    expect(permissionMode(NONE, DEFAULTS.permissionMode)).toBe('acceptEdits');
    expect(permissionOptions(null, DEFAULTS.permissionMode)[0]).toEqual({
      value: 'default',
      label: 'Défaut : Accepter les modifications',
      description: 'défaut en bac à sable',
    });
    expect(permissionLabel(NONE, { origin: null, value: null })).toBe('Défaut');
    expect(permissionMode(NONE)).toBe('ask');
    expect(permissionOptions(null).map(({ value }) => value)).not.toContain('default');
    const plan = withPermissionMode(NONE, 'plan');
    expect(permissionLabel(plan, DEFAULTS.permissionMode)).toBe('Plan');
    expect(withPermissionMode(plan, 'default').permissionMode).toBeNull();
  });

  it('names a button by its visible text, then the origin of a default value', () => {
    expect(spokenLabel('Modèle', 'Défaut : Sonnet 5.5', 'défaut du projet maison')).toBe(
      'Modèle : Défaut : Sonnet 5.5, défaut du projet maison',
    );
    expect(spokenLabel('Effort', 'Effort : élevé', null)).toBe('Effort : élevé');
  });
});
