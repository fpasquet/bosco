// Ce que les scénarios ne voient pas : le calcul à chaque tarif, cache compris, et les modèles inconnus.
import { describe, expect, it } from 'vitest';
import { estimateCostMicros } from './model-pricing.ts';
import { TokenUsage } from './token-usage.ts';

describe('estimateCostMicros', () => {
  it('prices input, output, cache writes and cache reads of Claude Opus 5.5', () => {
    // 1 M en entrée (4 $), 1 M en sortie (20 $), 1 M écrits (5 $), 1 M lus (0,20 $)
    const usage = new TokenUsage(1_000_000, 1_000_000, 1_000_000, 1_000_000);
    expect(estimateCostMicros('claude-opus-5-5', usage)).toBe(29_200_000);
  });

  it('ignores the date suffix of a model id', () => {
    expect(estimateCostMicros('claude-sonnet-5-5-20261001', new TokenUsage(1_000_000, 0, 0, 0))).toBe(2_000_000);
  });

  it('leaves an unknown model unpriced', () => {
    expect(estimateCostMicros('<synthetic>', new TokenUsage(10, 10, 0, 0))).toBeNull();
    expect(estimateCostMicros(null, new TokenUsage(10, 10, 0, 0))).toBeNull();
  });
});
