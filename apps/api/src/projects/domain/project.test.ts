// Ce que les scénarios ne voient pas : deux projets de même nom, un dossier ajouté deux fois, les noms de branche de
// départ refusés, la place proposée d'un dossier sans git et les domaines propres refusés.
import { describe, expect, it } from 'vitest';
import { FolderPath } from './folder.ts';
import {
  InvalidProjectDomain,
  InvalidStartBranch,
  Project,
  ProjectAlreadyAdded,
  ProjectDomainTaken,
  type ProjectSnapshot,
} from './project.ts';

const AT = new Date('2026-11-17T10:00:00Z');

function add(path: string, projects: ProjectSnapshot[]): ProjectSnapshot {
  return Project.add({
    addedAt: AT,
    folder: FolderPath.of(path),
    git: true,
    id: projects.length + 1,
    projects,
  }).toSnapshot();
}

describe('Project', () => {
  it('is named after its folder, not pinned', () => {
    expect(add('/home/dev/www/api-tarifs', [])).toEqual({
      addedAt: AT,
      defaults: { effort: null, model: null, permissionMode: null, profile: null },
      domains: [],
      git: true,
      id: 1,
      name: 'api-tarifs',
      path: '/home/dev/www/api-tarifs',
      pinned: false,
      place: null,
      startBranch: null,
    });
  });

  it('takes the name of its parent folder too when the name is already taken, then a number', () => {
    const projects: ProjectSnapshot[] = [];
    projects.push(add('/home/dev/www/api', projects));
    projects.push(add('/home/dev/clients/api', projects));
    projects.push(add('/srv/clients/api', projects));
    expect(projects.map(({ name }) => name)).toEqual(['api', 'clients/api', 'api (2)']);
  });

  it('adds a folder once only', () => {
    const projects = [add('/home/dev/www/api-tarifs', [])];
    expect(() => add('/home/dev/www/api-tarifs/', projects)).toThrow(ProjectAlreadyAdded);
  });

  it('keeps a start branch git accepts, the current branch when it is left empty', () => {
    const project = Project.restore(add('/home/dev/www/api-tarifs', []));
    project.change({ startBranch: '  release/2026.11 ' });
    expect(project.toSnapshot().startBranch).toBe('release/2026.11');
    project.change({ startBranch: '   ' });
    expect(project.toSnapshot().startBranch).toBeNull();
    for (const name of ['feat x', 'a..b', 'main.', '-main', 'feat/', 'a~1', 'x@{1}'])
      expect(() => project.change({ startBranch: name })).toThrow(InvalidStartBranch);
  });

  it('never proposes the sandbox for a folder without git', () => {
    const project = Project.restore({ ...add('/home/dev/notes-clubs', []), git: false });
    project.rememberPlace('sandbox');
    expect(project.toSnapshot().place).toBe('workstation');
  });

  it('keeps its own domains in lower case, once each, never a URL', () => {
    const project = Project.restore(add('/home/dev/www/api-tarifs', []));
    project.addDomain(' Paiement.exemple.dev ');
    project.addDomain('*.grilles.exemple.dev');
    expect(() => project.addDomain('paiement.exemple.dev')).toThrow(ProjectDomainTaken);
    expect(() => project.addDomain('https://pypi.org')).toThrow(InvalidProjectDomain);
    project.removeDomain('*.grilles.exemple.dev');
    expect(project.toSnapshot().domains).toEqual(['paiement.exemple.dev']);
  });
});
