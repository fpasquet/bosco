// Ce que les scénarios ne voient pas : la partie changée d'un champ, au début, au milieu, à la fin ou retirée.
import { describe, expect, it } from 'vitest';
import { changedPart } from './decisions';

const VERSION_2 = 'Arrondir les prix au centime supérieur : un créneau à 17,333 € est affiché 17,34 €.';

describe('changedPart', () => {
  it('CA-CONT-20 · keeps the added sentence apart from the text of version 2', () => {
    const added = `${VERSION_2} Les exceptions sont listées dans les grilles de tarifs.`;
    expect(changedPart(VERSION_2, added)).toEqual({
      prefix: '… créneau à 17,333 € est affiché 17,34 €.',
      changed: ' Les exceptions sont listées dans les grilles de tarifs.',
      suffix: '',
    });
  });

  it('finds a change in the middle of the text', () => {
    expect(changedPart('Arrondir au centime', 'Arrondir à l’euro au centime')).toEqual({
      prefix: 'Arrondir ',
      changed: 'à l’euro ',
      suffix: 'au centime',
    });
  });

  it('says nothing changed, or that text was only removed', () => {
    expect(changedPart(VERSION_2, VERSION_2)).toBeNull();
    expect(changedPart('Arrondir les prix', 'Arrondir')).toEqual({ prefix: 'Arrondir', changed: '', suffix: '' });
  });
});
