// Paliers des tokens de la page Usage : les milliards prennent le relais des millions.
import { describe, expect, it } from 'vitest';
import { formatAxisTokens, formatTokens } from './format';

const plain = (text: string) => text.replaceAll(/[\u00a0\u202f]/g, ' ');

describe('formatTokens', () => {
  it.each([
    [940, '940'],
    [41_200, '41 k'],
    [700_000, '0,7 M'],
    [615_120_000, '615,1 M'],
    [999_940_000, '999,9 M'],
    [999_960_000, '1,0 Md'],
    [1_151_594_468, '1,2 Md'],
  ])('rounds %i tokens', (count, expected) => {
    expect(plain(formatTokens(count))).toBe(expected);
  });
});

describe('formatAxisTokens', () => {
  it.each([
    [0, '0'],
    [500_000, '500 k'],
    [2_500_000, '2,5 M'],
    [1_500_000_000, '1,5 Md'],
  ])('labels the %i tick', (count, expected) => {
    expect(plain(formatAxisTokens(count))).toBe(expected);
  });
});
