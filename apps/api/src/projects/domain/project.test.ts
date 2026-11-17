// Ce que les scénarios ne voient pas : deux projets de même nom, et un dossier ajouté deux fois.
import { describe, expect, it } from 'vitest';
import { FolderPath } from './folder.ts';
import { Project, ProjectAlreadyAdded, type ProjectSnapshot } from './project.ts';

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
      git: true,
      id: 1,
      name: 'api-tarifs',
      path: '/home/dev/www/api-tarifs',
      pinned: false,
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
});
