import { describe, expect, it } from 'vitest';
import type { SocleDto } from '@bosco/domain';
import { concernedRepositories } from './socles';

const socle = (id: number, applied: string[], inherits: null | number = null): SocleDto => ({
  applied,
  decisions: [],
  exceptions: [],
  id,
  inherits,
  name: `Socle ${id}`,
  repositories: applied,
  scope: 'shared',
});

describe('concernedRepositories', () => {
  const socles = [socle(1, ['api-voix', 'api-liens']), socle(2, ['api-quiz'], 1), socle(3, ['outils-node'], 2)];

  it('counts the repositories of the socle and of those that inherit from it (CA-CONT-58)', () => {
    expect(concernedRepositories(1, socles)).toEqual(['api-liens', 'api-quiz', 'api-voix', 'outils-node']);
    expect(concernedRepositories(3, socles)).toEqual(['outils-node']);
  });

  it('adds the repositories reached after the change, every one for a global socle', () => {
    expect(concernedRepositories(3, socles, { scope: 'shared', repositories: ['api-signets'] })).toEqual([
      'api-signets',
      'outils-node',
    ]);
    expect(concernedRepositories(3, socles, { scope: 'global', repositories: [] }, ['a', 'b'])).toEqual([
      'a',
      'b',
      'outils-node',
    ]);
  });
});
