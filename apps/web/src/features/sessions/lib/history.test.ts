import { describe, expect, it } from 'vitest';
// Ce que les scénarios ne voient pas : les titres des jours, les séries du graphique et la graduation de l'axe.
import { dayTitle } from './history';

const now = new Date('2026-11-06T15:00:00');

describe('dayTitle', () => {
  it('names today, yesterday, then the weekday', () => {
    expect([dayTitle('2026-11-06', now), dayTitle('2026-11-05', now), dayTitle('2026-11-04', now)]).toEqual([
      'Aujourd’hui',
      'Hier',
      'Mercredi 4 nov.',
    ]);
  });
});
