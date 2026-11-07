// Ce que les scénarios ne voient pas : chaque palier des durées relatives et les chemins hors du dossier personnel.
import { describe, expect, it } from 'vitest';
import { dayLabel, displayPath, elapsed, formatCost, formatTokens, repositories, sessions, sinceNow } from './format';

const plain = (text: string) => text.replaceAll(/[\u00a0\u202f]/g, ' ');

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

describe('elapsed', () => {
  it.each([
    ['2026-11-06T14:02:00Z', '40 s'],
    ['2026-11-06T13:56:40Z', '6 min'],
    ['2026-11-06T12:50:40Z', '1 h 12'],
    ['2026-11-06T12:02:40Z', '2 h'],
    ['2026-11-03T14:02:40Z', '3 j'],
  ])('writes %s as a compact duration', (date, expected) => {
    expect(plain(elapsed(new Date(date), now))).toBe(expected);
  });
});

describe('formatCost', () => {
  it('writes dollars with a decimal comma, and says when no price is known', () => {
    expect(plain(formatCost({ unpriced: false, usd: 1.8412 }))).toBe('1,84 $');
    expect(formatCost({ unpriced: true, usd: 0 })).toBe('non chiffré');
  });
});

describe('formatTokens', () => {
  it.each([
    [940, '940'],
    [212_400, '212 k'],
    [1_240_000, '1,2 M'],
  ])('rounds %i tokens', (count, expected) => {
    expect(plain(formatTokens(count))).toBe(expected);
  });
});

describe('sessions and dayLabel', () => {
  it('agrees with the count and writes the day in full', () => {
    expect([sessions(1), sessions(3)]).toEqual(['1 session', '3 sessions']);
    expect(dayLabel(new Date('2026-11-06T12:00:00'))).toBe('vendredi 6 novembre');
  });
});
