// Ce que les scénarios ne voient pas : un Bosco plus ancien refuse la base d'un Bosco plus récent (CA-APPS-10).
import { describe, expect, it } from 'vitest';
import { newerMigrations } from './database-version.ts';

describe('newerMigrations', () => {
  it('CA-APPS-10 · lists the executed migrations this Bosco does not know', () => {
    const known = ['Migration20261107000000', 'Migration20261108210000'];
    expect(newerMigrations(['Migration20261107000000.js', 'Migration20261108210000'], known)).toEqual([]);
    expect(newerMigrations(['Migration20261107000000', 'Migration20261201000000.ts'], known)).toEqual([
      'Migration20261201000000',
    ]);
  });
});
