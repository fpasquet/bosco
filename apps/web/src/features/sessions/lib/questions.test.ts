// Ce que les scénarios ne voient pas : chaque forme du suffixe de l'option recommandée par l'agent.
import { describe, expect, it } from 'vitest';
import { recommendedOf } from './questions';

describe('recommendedOf', () => {
  it.each([
    ['Arrondir à la minute à la lecture (Recommended)'],
    ['Arrondir à la minute à la lecture (Recommandé)'],
    ['Arrondir à la minute à la lecture (recommandée) '],
  ])('reads %s as the recommended option, without its suffix', (label) => {
    expect(recommendedOf(label)).toEqual({ label: 'Arrondir à la minute à la lecture', recommended: true });
  });

  it('leaves the other options as they are', () => {
    expect(recommendedOf('Garder les secondes (Recommended by the team) partout')).toEqual({
      label: 'Garder les secondes (Recommended by the team) partout',
      recommended: false,
    });
  });
});
