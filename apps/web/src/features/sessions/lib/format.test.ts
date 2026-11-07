// Ce que les scénarios ne voient pas : chaque palier des durées relatives et les chemins hors du dossier personnel.
import { describe, expect, it } from 'vitest';
import { displayPath, repositories, sinceNow } from './format';

const now = new Date('2026-11-06T14:02:40Z');

describe('sinceNow', () => {
  it.each([
    ['2026-11-06T14:02:00Z', 'il y a 40 s'],
    ['2026-11-06T13:59:40Z', 'il y a 3 min'],
    ['2026-11-06T11:02:40Z', 'il y a 3 h'],
    ['2026-11-04T14:02:40Z', 'il y a 2 j'],
  ])('writes %s relative to now', (date, expected) => {
    // Intl sépare le nombre de l'unité par une espace insécable, correcte en typographie française
    expect(sinceNow(new Date(date), now).replaceAll(/[\u00a0\u202f]/g, ' ')).toBe(expected);
  });
});

describe('displayPath', () => {
  it('replaces the home folder by ~ and keeps other paths', () => {
    expect(displayPath('/home/dev/.claude', '/home/dev')).toBe('~/.claude');
    expect(displayPath('/home/devops/.claude', '/home/dev')).toBe('/home/devops/.claude');
  });
});

describe('repositories', () => {
  it('agrees with the count', () => {
    expect([repositories(1), repositories(29)]).toEqual(['1 dépôt', '29 dépôts']);
  });
});
