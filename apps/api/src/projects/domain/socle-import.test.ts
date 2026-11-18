// Ce que les scénarios ne voient pas : la reprise des socles en groupes, faite une fois sur la base du poste au passage
// aux groupes, que les scénarios ne peuvent plus créer.
import { describe, expect, it } from 'vitest';
import { groupsFromSocles, instructionOf, type RetiredSocle } from './socle-import.ts';

const PROJECTS = ['api-tarifs', 'creneaux', 'site-clubs', 'api-voix', 'labo-ia'];

const socle = (id: number, name: string, overrides: Partial<RetiredSocle> = {}): RetiredSocle => ({
  id,
  name,
  scope: 'shared',
  inherits: null,
  projects: [],
  ...overrides,
});

const decision = (id: number, socleId: number, title: string, body = `${title}.`) => ({
  id,
  socle: socleId,
  title,
  decision: body,
});

describe('groupsFromSocles', () => {
  it('turns the common socle into the instructions of « Tous les projets », one accepted decision per line', () => {
    const found = groupsFromSocles({
      allProjects: PROJECTS,
      socles: [socle(1, 'Socle commun', { scope: 'global' })],
      decisions: [
        decision(9, 1, 'Node 22 au minimum'),
        decision(8, 1, 'Messages de commit en anglais', 'Au format\nConventional Commits.'),
      ],
      taken: [],
    });
    expect(found).toEqual({
      common: 'Messages de commit en anglais : Au format Conventional Commits.\nNode 22 au minimum.',
      groups: [],
    });
  });

  it('turns a shared socle into a group, joined by the projects of the socles that inherited from it', () => {
    const found = groupsFromSocles({
      allProjects: PROJECTS,
      socles: [
        socle(2, 'Node.js', { projects: ['api-voix', 'labo-ia'] }),
        socle(3, 'NestJS', { inherits: 2, projects: ['api-tarifs', 'api-voix'] }),
        socle(4, 'Fastify', { inherits: 3, projects: ['creneaux', 'disparu'] }),
      ],
      decisions: [decision(10, 2, 'Tests avec Vitest'), decision(11, 3, 'Modules par contexte')],
      taken: [],
    });
    expect(found.groups).toEqual([
      {
        name: 'Node.js',
        instructions: 'Tests avec Vitest.',
        projects: ['api-voix', 'labo-ia', 'api-tarifs', 'creneaux'],
      },
      { name: 'NestJS', instructions: 'Modules par contexte.', projects: ['api-tarifs', 'api-voix', 'creneaux'] },
      { name: 'Fastify', instructions: '', projects: ['creneaux'] },
    ]);
  });

  it('gives every project to a shared socle that a global socle inherited from', () => {
    const found = groupsFromSocles({
      allProjects: PROJECTS,
      socles: [socle(2, 'Node.js', { projects: ['labo-ia'] }), socle(1, 'Commun', { scope: 'global', inherits: 2 })],
      decisions: [],
      taken: [],
    });
    expect(found.groups[0]?.projects).toEqual(PROJECTS);
  });

  it('numbers a name already taken by a group, « Tous les projets » included', () => {
    const found = groupsFromSocles({
      allProjects: PROJECTS,
      socles: [socle(2, 'Tous les projets'), socle(3, 'Clubs'), socle(4, 'clubs')],
      decisions: [],
      taken: ['Clubs'],
    });
    expect(found.groups.map(({ name }) => name)).toEqual(['Tous les projets (2)', 'Clubs (2)', 'clubs (3)']);
  });
});

describe('instructionOf', () => {
  it('keeps the decision alone when it starts with its title', () => {
    expect(instructionOf({ title: 'Tests avec Vitest.', decision: 'Tests avec Vitest, jamais Jest.' })).toBe(
      'Tests avec Vitest, jamais Jest.',
    );
    expect(instructionOf({ title: 'Journaux', decision: ' ' })).toBe('Journaux');
  });
});
