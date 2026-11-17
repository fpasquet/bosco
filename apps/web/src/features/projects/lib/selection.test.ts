import { describe, expect, it } from 'vitest';
// Ce que les scénarios ne voient pas : les accords des libellés et les dépôts déjà cochés ailleurs.
import type { FolderListingDto } from '@bosco/domain';
import { addLabel, checkedLabel, checkGitLabel, gitToCheck, toggleFolder } from './selection';

const listing: FolderListingDto = {
  crumbs: [{ name: '~', path: '/home/dev' }],
  folders: [
    { added: true, git: true, name: 'creneaux', path: '/home/dev/www/creneaux', suggestion: false },
    { added: false, git: true, name: 'essais-css', path: '/home/dev/www/essais-css', suggestion: true },
    { added: false, git: false, name: 'archives', path: '/home/dev/www/archives', suggestion: false },
    { added: false, git: true, name: 'site-tournois', path: '/home/dev/www/site-tournois', suggestion: false },
  ],
  home: '/home/dev',
  parent: '/home/dev',
  path: '/home/dev/www',
};

describe('Folder selection', () => {
  it('checks the git repositories not added yet, leaving out those already checked', () => {
    const chosen = [{ git: true, name: 'site-tournois', path: '/home/dev/www/site-tournois' }];
    expect(gitToCheck(listing, []).map(({ name }) => name)).toEqual(['essais-css', 'site-tournois']);
    expect(gitToCheck(listing, chosen).map(({ name }) => name)).toEqual(['essais-css']);
  });

  it('checks then unchecks a folder', () => {
    const folder = { git: false, name: 'archives', path: '/home/dev/www/archives' };
    expect(toggleFolder(toggleFolder([], folder), folder)).toEqual([]);
  });

  it('agrees the labels with the count', () => {
    expect([checkGitLabel(2), checkGitLabel(1)]).toEqual([
      'Cocher les 2 dépôts git non ajoutés de ce dossier',
      'Cocher le dépôt git non ajouté de ce dossier',
    ]);
    expect([addLabel(2), addLabel(1), checkedLabel(2), checkedLabel(1)]).toEqual([
      'Ajouter 2 projets',
      'Ajouter 1 projet',
      '2 dossiers cochés',
      '1 dossier coché',
    ]);
  });
});
