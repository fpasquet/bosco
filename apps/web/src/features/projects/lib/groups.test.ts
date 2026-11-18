// Ce que les scénarios ne voient pas : les projets comptés par la confirmation et l'ordre du texte transmis.
import { describe, expect, it } from 'vitest';
import { allProjectsGroup, clubsGroup, storyGroups } from '../fixtures';
import { arrivalOrder, touchedProjects } from './groups';

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
