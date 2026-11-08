// Ce que les scénarios ne voient pas : « owner/repo » d'une adresse GitHub, en SSH comme en HTTPS.
import { describe, expect, it } from 'vitest';
import { githubRepositoryOf } from './git-review.ts';

describe('githubRepositoryOf', () => {
  it('reads the repository of an SSH or HTTPS remote, and nothing elsewhere', () => {
    expect(
      [
        'git@github.com:fpasquet/bosco.git',
        'https://github.com/fpasquet/bosco.git',
        'https://github.com/fpasquet/bosco',
        'ssh://git@github.com/fpasquet/bosco.git',
        'git@gitlab.com:fpasquet/bosco.git',
      ].map((remote) => githubRepositoryOf(remote)),
    ).toEqual(['fpasquet/bosco', 'fpasquet/bosco', 'fpasquet/bosco', 'fpasquet/bosco', null]);
  });
});
