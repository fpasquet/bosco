import { describe, expect, it } from 'vitest';
import type { SocleDto } from '@bosco/domain';
import { concernedProjects } from './socles';

const socle = (id: number, applied: string[], inherits: null | number = null): SocleDto => ({
  applied,
  decisions: [],
  exceptions: [],
  id,
  inherits,
  name: `Socle ${id}`,
  projects: applied,
  scope: 'shared',
});

describe('concernedProjects', () => {
  const socles = [socle(1, ['api-voix', 'api-liens']), socle(2, ['api-quiz'], 1), socle(3, ['outils-node'], 2)];

  it('counts the projects of the socle and of those that inherit from it (CA-CONT-58)', () => {
    expect(concernedProjects(1, socles)).toEqual(['api-liens', 'api-quiz', 'api-voix', 'outils-node']);
    expect(concernedProjects(3, socles)).toEqual(['outils-node']);
  });

  it('adds the projects reached after the change, every one for a global socle', () => {
    expect(concernedProjects(3, socles, { scope: 'shared', projects: ['api-signets'] })).toEqual([
      'api-signets',
      'outils-node',
    ]);
    expect(concernedProjects(3, socles, { scope: 'global', projects: [] }, ['a', 'b'])).toEqual([
      'a',
      'b',
      'outils-node',
    ]);
  });
});
