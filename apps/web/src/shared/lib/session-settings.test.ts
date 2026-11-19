import { describe, expect, it } from 'vitest';
import { modelChoice, modelName, supportsAutoMode } from './session-settings';

describe('modelChoice', () => {
  it('reads a Claude Code alias as the latest model of its family', () => {
    expect(modelChoice('opus')?.value).toBe('claude-opus-5-5');
    expect(modelChoice('Sonnet')?.value).toBe('claude-sonnet-5-5');
    expect(modelChoice('haiku')?.value).toBe('claude-haiku-5-5');
    expect(modelChoice('opus[1m]')?.value).toBe('claude-opus-5-5');
  });

  it('reads a full or dated identifier', () => {
    expect(modelChoice('claude-opus-5-5')?.label).toBe('Opus 5.5');
    expect(modelChoice('claude-haiku-4-5-20251001')?.label).toBe('Haiku 4.5');
  });

  it('knows neither another alias nor an unknown model', () => {
    expect(modelChoice('opusplan')).toBeUndefined();
    expect(modelChoice('claude-opus-5')).toBeUndefined();
    expect(modelChoice(null)).toBeUndefined();
  });
});

describe('modelName', () => {
  it('names the model an alias stands for', () => {
    expect(modelName('opus')).toBe('Opus 5.5');
    expect(modelName('sonnet[1m]')).toBe('Sonnet 5.5 · 1M');
  });

  it('keeps an unknown model as it is and names the profile default', () => {
    expect(modelName('opusplan')).toBe('opusplan');
    expect(modelName(null)).toBe('Défaut du profil');
  });
});

describe('supportsAutoMode', () => {
  it('follows the model an alias stands for', () => {
    expect(supportsAutoMode('haiku')).toBe(true);
    expect(supportsAutoMode('claude-haiku-4-5-20251001')).toBe(false);
  });
});
