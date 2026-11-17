import { describe, expect, it } from 'vitest';
import { agoOf, coresOf, countsOf, memoryOf, memoryUsageOf, nearCeiling, somethingRuns } from './containers';

const GB = 1024 ** 3;
const MB = 1024 ** 2;

describe('container usage', () => {
  it('reads the processor and the memory against their ceiling (CA-CONT-73)', () => {
    expect(coresOf({ cpu: 1.7, cpuLimit: 2 })).toBe('1,7 / 2 cœurs');
    expect(coresOf({ cpu: 0.1, cpuLimit: 1 })).toBe('0,1 / 1 cœur');
    expect(coresOf({ cpu: 0.3, cpuLimit: null })).toBe('0,3 cœur');
    expect(memoryUsageOf({ memory: 3.6 * GB, memoryLimit: 4 * GB })).toBe('3,6 / 4 Go');
    expect(memoryUsageOf({ memory: 412 * MB, memoryLimit: GB })).toBe('412 Mo / 1 Go');
    expect(memoryUsageOf({ memory: 410 * MB, memoryLimit: null })).toBe('410 Mo');
    expect(memoryOf(5.7 * GB)).toBe('5,7 Go');
    expect(memoryOf(4 * GB)).toBe('4 Go');
  });

  it('turns orange from 80 % of the ceiling, never without a ceiling', () => {
    expect(nearCeiling({ cpu: 1.7, cpuLimit: 2, memory: 3.6 * GB, memoryLimit: 4 * GB })).toEqual({
      cpu: true,
      memory: true,
    });
    expect(nearCeiling({ cpu: 0.4, cpuLimit: 2, memory: 1.1 * GB, memoryLimit: 4 * GB })).toEqual({
      cpu: false,
      memory: false,
    });
    expect(nearCeiling({ cpu: 9, cpuLimit: null, memory: 9 * GB, memoryLimit: null })).toEqual({
      cpu: false,
      memory: false,
    });
  });

  it('counts what runs, without zero groups', () => {
    const totals = { cpu: 2.7, memory: 5.7 * GB, piloted: 1, sandboxes: 2 };
    expect(countsOf({ totals })).toBe('2 bacs à sable · 1 tour sur le poste');
    expect(countsOf({ totals: { ...totals, sandboxes: 0 } })).toBe('1 tour sur le poste');
    expect(countsOf({ totals: { ...totals, piloted: 0, sandboxes: 1 } })).toBe('1 bac à sable');
  });
});

describe('agoOf', () => {
  it('says how long ago the last measure was, then its time', () => {
    const at = new Date('2026-11-06T15:13:00').getTime();
    expect(agoOf('2026-11-06T15:13:00', at + 2000)).toBe('il y a 2 s');
    expect(agoOf('2026-11-06T15:13:00', at + 180_000)).toBe('il y a 3 min');
    expect(agoOf('2026-11-06T15:13:00', at + 2 * 3_600_000)).toBe('à 15:13');
  });
});

describe('somethingRuns (CA-CONT-70, CA-CONT-80)', () => {
  const idle = {
    hostCpus: 16,
    measuredAt: null,
    piloted: [],
    sandboxes: [],
    totals: { cpu: 0, memory: 0, piloted: 0, sandboxes: 0 },
    unreachableSince: null,
  };

  it('shows the summary only when something runs, or when Docker does not answer', () => {
    expect(somethingRuns(undefined)).toBe(false);
    expect(somethingRuns(idle)).toBe(false);
    expect(somethingRuns({ ...idle, unreachableSince: '2026-11-06T15:09:00Z' })).toBe(true);
  });
});
