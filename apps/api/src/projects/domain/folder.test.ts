// Ce que les scénarios ne voient pas : les chemins refusés par le navigateur de dossiers, même écrits à la main.
import { describe, expect, it } from 'vitest';
import {
  browsedFolder,
  crumbsOf,
  FolderPath,
  FolderRefused,
  InvalidFolder,
  parentOf,
  visibleFolders,
} from './folder.ts';

const HOME = '/home/dev';

describe('FolderPath', () => {
  it('writes an absolute path without a trailing or doubled slash', () => {
    expect(FolderPath.of(' /home//dev/www/ ').value).toBe('/home/dev/www');
    expect(FolderPath.of('/').value).toBe('/');
    expect(FolderPath.of('/home/dev/www/api-tarifs')).toMatchObject({ name: 'api-tarifs', parentName: 'www' });
  });

  it('refuses a relative path and a path that climbs up', () => {
    expect(() => FolderPath.of('www')).toThrow(InvalidFolder);
    expect(() => FolderPath.of('~/www')).toThrow(InvalidFolder);
    expect(() => FolderPath.of('/home/dev/../root')).toThrow(InvalidFolder);
    expect(() => FolderPath.of('/home/./dev')).toThrow(InvalidFolder);
  });
});

describe('Folder browser', () => {
  it('starts at the home folder and opens only the visible folders inside it', () => {
    expect(browsedFolder(null, HOME).value).toBe(HOME);
    expect(browsedFolder('/home/dev/www', HOME).value).toBe('/home/dev/www');
    expect(() => browsedFolder('/etc', HOME)).toThrow(FolderRefused);
    expect(() => browsedFolder('/home/devil', HOME)).toThrow(FolderRefused);
    expect(() => browsedFolder('/home/dev/.ssh', HOME)).toThrow(FolderRefused);
    expect(() => browsedFolder('/home/dev/www/.git/hooks', HOME)).toThrow(FolderRefused);
  });

  it('opens and shows the hidden folders only to choose a configuration folder of Claude Code', () => {
    expect(browsedFolder('/home/dev/.claude-perso', HOME, true).value).toBe('/home/dev/.claude-perso');
    expect(() => browsedFolder('/etc', HOME, true)).toThrow(FolderRefused);
    const entries = [
      { directory: true, git: false, name: '.claude-perso' },
      { directory: true, git: true, name: 'www' },
    ];
    expect(visibleFolders(entries, true).map(({ name }) => name)).toEqual(['.claude-perso', 'www']);
  });

  it('CA-CONT-114 · shows folders only, never files nor hidden folders, in the order of their names', () => {
    const entries = [
      { directory: true, git: true, name: 'site-clubs' },
      { directory: false, git: false, name: 'notes.md' },
      { directory: true, git: false, name: '.cache' },
      { directory: true, git: false, name: 'Archives' },
      { directory: true, git: true, name: 'api-tarifs' },
    ];
    expect(visibleFolders(entries)).toEqual([
      { git: true, name: 'api-tarifs' },
      { git: false, name: 'Archives' },
      { git: true, name: 'site-clubs' },
    ]);
  });

  it('climbs back to the home folder, never above it', () => {
    const folder = browsedFolder('/home/dev/www/creneaux', HOME);
    expect(crumbsOf(folder, HOME)).toEqual([
      { name: '~', path: HOME },
      { name: 'www', path: '/home/dev/www' },
      { name: 'creneaux', path: '/home/dev/www/creneaux' },
    ]);
    expect(parentOf(folder, HOME)).toBe('/home/dev/www');
    expect(parentOf(browsedFolder(null, HOME), HOME)).toBeNull();
  });
});
