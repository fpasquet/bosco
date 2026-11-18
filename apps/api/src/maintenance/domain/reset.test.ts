// Ce que les scénarios ne voient pas : la forme exacte du mot qui confirme la réinitialisation.
import { describe, expect, it } from 'vitest';
import { checkResetWord, ResetNotConfirmed } from './reset.ts';

describe('checkResetWord', () => {
  it('CA-REGL-30 · accepts the word whatever its case, its accents or the spaces around it', () => {
    for (const word of [' RÉINITIALISER ', 'réinitialiser', 'REINITIALISER', 'Reinitialiser'])
      expect(() => checkResetWord(word)).not.toThrow();
  });

  it('CA-REGL-30 · refuses another word or a misspelt one', () => {
    for (const word of ['oui', '', 'RÉINITIALISE', 'RÉ INITIALISER'])
      expect(() => checkResetWord(word)).toThrow(ResetNotConfirmed);
  });
});
