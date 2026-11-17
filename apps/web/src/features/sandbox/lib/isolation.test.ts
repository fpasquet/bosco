import { describe, expect, it } from 'vitest';
import { gigabytes } from './isolation';

describe('isolation', () => {
  it('shows memory in whole gigabytes', () => {
    expect(gigabytes(4 * 1024 ** 3)).toBe('4 Go');
  });
});
