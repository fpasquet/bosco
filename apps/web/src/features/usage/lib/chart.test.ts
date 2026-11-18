// Ce que les scénarios ne voient pas : la géométrie exacte du graphique (graduations, empilement, 2 px entre les
// segments et au moins 2 px chacun) et les jours dont le total s'inscrit.
import { describe, expect, it } from 'vitest';
import type { UsageDayDto } from '@bosco/domain';
import { axisOf, labeledDays, segmentsOf, SERIES } from './chart';

function day(date: string, cacheRead: number, input = 0): UsageDayDto {
  return {
    date,
    tokens: { input, output: 0, cacheRead, cacheCreation: 0 },
    cost: { input: 0, output: 0, cacheRead: cacheRead / 1_000_000, cacheCreation: 0 },
  };
}

describe('axisOf', () => {
  it('rounds the axis up to three readable steps', () => {
    expect(axisOf(122_800_000)).toEqual({ max: 150_000_000, ticks: [0, 50_000_000, 100_000_000, 150_000_000] });
    expect(axisOf(25_800_000).max).toBe(30_000_000);
    expect(axisOf(21.4).ticks).toEqual([0, 10, 20, 30]);
    expect(axisOf(0)).toEqual({ max: 1, ticks: [0, 1] });
  });
});

describe('segmentsOf', () => {
  it('stacks the cache read at the bottom and the input on top, 2 px apart, a thin one kept at 2 px', () => {
    const segments = segmentsOf(day('2026-11-06', 100, 1), 'tokens', 1);
    expect(segments).toEqual([
      { key: 'cacheRead', color: 3, height: 100, offset: 0 },
      { key: 'input', color: 1, height: 2, offset: 102 },
    ]);
  });

  it('keeps the colour of each series whatever the series shown', () => {
    expect(SERIES.map(({ color, key }) => [key, color])).toEqual([
      ['input', 1],
      ['output', 2],
      ['cacheRead', 3],
      ['cacheCreation', 4],
    ]);
  });
});

describe('labeledDays', () => {
  it('writes the total on the peak and on the last day only', () => {
    const days = [day('2026-11-05', 10), day('2026-11-06', 90), day('2026-11-07', 20), day('2026-11-08', 30)];
    expect([...labeledDays(days, 'tokens')]).toEqual([1, 3]);
    expect([...labeledDays([day('2026-11-08', 0)], 'tokens')]).toEqual([]);
  });
});
