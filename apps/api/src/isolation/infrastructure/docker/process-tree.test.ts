import { describe, expect, it } from 'vitest';
import { parseStat, treeOf } from './process-tree.ts';

describe('parseStat', () => {
  it('reads the parent, the processor ticks and the resident pages, even with spaces in the name', () => {
    const line =
      '4242 (claude code) S 4100 4242 4100 0 -1 4194560 1200 0 0 0 350 90 0 0 20 0 11 0 9000 1000000 25600 18446744073709551615';
    expect(parseStat(line)).toEqual({ parent: 4100, rss: 25600, ticks: 440 });
  });
});

describe('treeOf', () => {
  it('returns the process and all its descendants', () => {
    const stats = new Map([
      [10, { parent: 1 }],
      [11, { parent: 10 }],
      [12, { parent: 11 }],
      [20, { parent: 1 }],
    ]);
    expect(treeOf(10, stats)).toEqual([10, 11, 12]);
    expect(treeOf(99, stats)).toEqual([]);
  });
});
