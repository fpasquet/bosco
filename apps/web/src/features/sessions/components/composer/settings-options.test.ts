import { describe, expect, it } from 'vitest';
import { effortLabel, effortOptions, modelLabel, modelOptions, modelValue, spokenLabel } from './settings-options';

const NONE = { effort: null, model: null, permissionMode: 'ask' } as const;
const DEFAULTS = {
  effort: { origin: 'défaut du projet maison', value: 'high' },
  model: { origin: null, value: 'opus' },
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

  it('names a button by its visible text, then the origin of a default value', () => {
    expect(spokenLabel('Modèle', 'Défaut : Sonnet 5.5', 'défaut du projet maison')).toBe(
      'Modèle : Défaut : Sonnet 5.5, défaut du projet maison',
    );
    expect(spokenLabel('Effort', 'Effort : élevé', null)).toBe('Effort : élevé');
  });
});
