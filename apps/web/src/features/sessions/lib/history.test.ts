import { describe, expect, it } from 'vitest';
// Ce que les scénarios ne voient pas : les titres des jours, les séries du graphique et la graduation de l'axe.
import type { CostReportDto } from '@bosco/domain';
import { axisMax, chartSeries, dayTitle, seriesCost } from './history';

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

describe('chart', () => {
  const repo = (name: string, usd: number) => ({ name, sessions: 1, share: 0, usd });
  const report = {
    byRepository: [
      repo('labo-ia', 5),
      repo('outils-node', 3),
      repo('api-voix', 2),
      repo('scripts', 1),
      repo('notes', 1),
    ],
    days: [{ date: '2026-11-06', repositories: [repo('labo-ia', 2), repo('scripts', 1), repo('notes', 0.5)] }],
  } as unknown as CostReportDto;

  it('keeps three repositories, then puts the others together', () => {
    const series = chartSeries(report);
    expect(series.map(({ label }) => label)).toEqual(['labo-ia', 'outils-node', 'api-voix', 'autres dépôts']);
    const top = series.slice(0, 3).map(({ name }) => name);
    expect(seriesCost(report.days[0] as never, { name: '*' }, top)).toBe(1.5);
  });

  it('rounds the axis up to a readable step', () => {
    expect([axisMax([6.14, 3]), axisMax([0.42]), axisMax([13])]).toEqual([8, 0.5, 20]);
  });
});
