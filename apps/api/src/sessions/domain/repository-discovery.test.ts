// Ce que les scénarios ne voient pas : chaque règle de rangement d'une session dans son dépôt (E4d).
import { describe, expect, it } from 'vitest';
import { DEFAULT_DISCOVERY, type DiscoverySnapshot, folderPath, RepositoryDiscovery } from './repository-discovery.ts';

const HOME = '/home/dev';
const WORKTREES: Record<string, string> = { '/home/dev/www/labo-ia/.claude/worktrees/fix-ui': '/home/dev/www/labo-ia' };

function placeOf(settings: Partial<DiscoverySnapshot>, gitRoot: null | string, path: null | string) {
  const discovery = new RepositoryDiscovery(
    { ...DEFAULT_DISCOVERY, ...settings },
    HOME,
    (root) => WORKTREES[root] ?? null,
  );
  return discovery.placeOf(gitRoot, path);
}

describe('RepositoryDiscovery', () => {
  it('keeps the git root and the folder inside it', () => {
    expect(placeOf({}, '/home/dev/www/labo-ia', '/home/dev/www/labo-ia/packages/bosco')).toEqual({
      folder: 'packages/bosco',
      git: true,
      hidden: false,
      name: 'labo-ia',
      root: '/home/dev/www/labo-ia',
    });
  });

  it('leaves a session outside git without a repository, unless git only is off (CA-SESS-77)', () => {
    expect(placeOf({}, null, '/home/dev')).toBeNull();
    expect(placeOf({ gitOnly: false }, null, '/home/dev/notes')).toMatchObject({ git: false, name: 'notes' });
  });

  it('files a worktree under its origin, unless attaching is off (CA-SESS-78)', () => {
    const worktree = '/home/dev/www/labo-ia/.claude/worktrees/fix-ui';
    expect(placeOf({}, worktree, `${worktree}/apps/web`)).toMatchObject({
      folder: 'apps/web',
      name: 'labo-ia',
      root: '/home/dev/www/labo-ia',
    });
    expect(placeOf({ attachWorktrees: false }, worktree, worktree)).toMatchObject({ name: 'fix-ui', root: worktree });
  });

  it('keeps only the repositories under the repository folders, excluded folders first (CA-SESS-79)', () => {
    const settings = { excluded: ['/tmp', '~/www/archives'], roots: ['~/www'] };
    expect(placeOf(settings, '/home/dev/www/api-voix', '/home/dev/www/api-voix')).not.toBeNull();
    expect(placeOf(settings, '/home/dev/projets/site', '/home/dev/projets/site')).toBeNull();
    expect(placeOf(settings, '/home/dev/www/archives/old', '/home/dev/www/archives/old')).toBeNull();
    const scratch = { excluded: ['/srv/scratch'] };
    expect(placeOf(scratch, '/srv/scratch/essai', '/srv/scratch/essai')).toBeNull();
    // Un dossier qui commence pareil n'est pas à l'intérieur
    expect(placeOf(scratch, '/srv/scratchpad/essai', '/srv/scratchpad/essai')).not.toBeNull();
  });

  it('finds the git root of a session read before Bosco noted it', () => {
    const rootOf = (path: string) => (path.startsWith('/home/dev/www/api-voix') ? '/home/dev/www/api-voix' : null);
    const discovery = new RepositoryDiscovery(DEFAULT_DISCOVERY, HOME, () => null, rootOf);
    expect(discovery.placeOf(null, '/home/dev/www/api-voix/src')).toMatchObject({ folder: 'src', name: 'api-voix' });
    expect(discovery.placeOf(null, '/home/dev')).toBeNull();
  });

  it('marks a hidden repository without removing it (CA-SESS-80)', () => {
    const hidden = { hidden: ['/home/dev/www/rules-sandbox'] };
    expect(placeOf(hidden, '/home/dev/www/rules-sandbox', '/home/dev/www/rules-sandbox')).toMatchObject({
      hidden: true,
    });
  });
});

describe('folderPath', () => {
  it('reads a folder as written in the terminal', () => {
    expect(['~/www/', '/tmp', ' ~ ', '//srv//data'].map((path) => folderPath(path))).toEqual([
      '~/www',
      '/tmp',
      '~',
      '/srv/data',
    ]);
  });

  it('refuses a relative path or one that goes up', () => {
    expect(() => folderPath('www')).toThrow(/chemin absolu/);
    expect(() => folderPath('~/www/../tmp')).toThrow(/remonter/);
  });
});
