import { describe, expect, it } from 'vitest';
import { gigabytes, refusalTime } from './isolation';

describe('isolation', () => {
  it('dates a refusal from today, yesterday, then by day', () => {
    const now = new Date(2026, 10, 6, 15, 30);
    expect(refusalTime(new Date(2026, 10, 6, 15, 2).toISOString(), now)).toBe('15:02');
    expect(refusalTime(new Date(2026, 10, 5, 11, 41).toISOString(), now)).toBe('hier 11:41');
    expect(refusalTime(new Date(2026, 10, 3, 9, 5).toISOString(), now)).toBe('3 nov. 09:05');
  });

  it('shows memory in whole gigabytes', () => {
    expect(gigabytes(4 * 1024 ** 3)).toBe('4 Go');
  });
});
