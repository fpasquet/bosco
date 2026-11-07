// Ce que les scénarios ne voient pas : chaque façon dont un code d'appairage est refusé (NF-14).
import { describe, expect, it } from 'vitest';
import { PAIRING_CODE, PairingCode } from './pairing-code.ts';

const now = new Date('2026-11-06T15:00:00Z');
const later = (ms: number) => new Date(now.getTime() + ms);

describe('PairingCode', () => {
  it('is accepted once, spaces aside', () => {
    const code = PairingCode.issue('482913', now);
    expect([code.claim('482 913', later(1000)), code.claim('482913', later(2000))]).toEqual(['accepted', 'exhausted']);
  });

  it('is refused after 5 minutes', () => {
    expect(PairingCode.issue('482913', now).claim('482913', later(PAIRING_CODE.lifetimeMs))).toBe('expired');
  });

  it('is refused after 5 wrong attempts, even with the right code', () => {
    const code = PairingCode.issue('482913', now);
    const results = [1, 2, 3, 4, 5].map(() => code.claim('000000', later(1000)));
    expect([results, code.claim('482913', later(2000))]).toEqual([
      ['wrong', 'wrong', 'wrong', 'wrong', 'exhausted'],
      'exhausted',
    ]);
  });
});
