// Ce que les scénarios ne voient pas : chaque forme de l'adresse de la page Usage, valeurs inconnues comprises.
import { describe, expect, it } from 'vitest';
import { DEFAULT_FILTERS, filtersOf, isDefault, searchOf } from './filters';

describe('filtersOf and searchOf', () => {
  it('reads the filters of the address and writes back only what differs from the defaults', () => {
    const filters = filtersOf(new URLSearchParams('period=7&group=2&model=claude-opus-5-5'));
    expect(filters).toEqual({ period: '7', profile: null, scope: { kind: 'group', id: 2 }, model: 'claude-opus-5-5' });
    expect(searchOf(filters)).toBe('?period=7&group=2&model=claude-opus-5-5');
    expect(searchOf(DEFAULT_FILTERS)).toBe('');
  });

  it('prefers a project to a group, and falls back to the defaults for unknown values', () => {
    expect(filtersOf(new URLSearchParams('period=12&group=2&project=1')).scope).toEqual({ kind: 'project', id: 1 });
    expect(isDefault(filtersOf(new URLSearchParams('period=12&group=abc')))).toBe(true);
  });
});
