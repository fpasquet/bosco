// Ce que les scénarios ne voient pas : les projets comptés par la confirmation, l'ordre du texte transmis et les
// projets proposés par l'aperçu d'un groupe.
import { describe, expect, it } from 'vitest';
import { allProjectsGroup, clubsGroup, storyGroups } from '../fixtures';
import { arrivalOrder, previewChoices, touchedProjects } from './groups';

describe('touchedProjects', () => {
  it('counts the projects that join and those that leave, not those that only move', () => {
    const before = clubsGroup.projects;
    const after = [before[2]!, before[0]!, { id: 6, name: 'notes-clubs' }];
    expect(touchedProjects(before, after)).toEqual(['notes-clubs', 'creneaux']);
  });
});

describe('arrivalOrder', () => {
  it('starts with « Tous les projets », then the groups of the principal project, this one marked', () => {
    expect(arrivalOrder(clubsGroup, storyGroups)).toEqual([
      { name: 'Tous les projets', current: false, lines: 2 },
      { name: 'Club des Trois Lacs', current: true, lines: 2 },
      { name: 'Node.js', current: false, lines: 2 },
    ]);
  });

  it('has « Tous les projets » alone for itself', () => {
    expect(arrivalOrder(allProjectsGroup, storyGroups)[0]).toEqual({
      name: 'Tous les projets',
      current: true,
      lines: 2,
    });
  });
});

describe('previewChoices', () => {
  it('offers the projects of a group, its principal first', () => {
    expect(previewChoices(clubsGroup)).toEqual(clubsGroup.projects.map(({ name }) => name));
  });

  it('offers every project of « Tous les projets » in alphabetical order', () => {
    const names = allProjectsGroup.projects.map(({ name }) => name);
    expect(previewChoices(allProjectsGroup)).toEqual(names.toSorted((a, b) => a.localeCompare(b, 'fr')));
  });
});
