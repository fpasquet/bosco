import { EntitySchema } from '@mikro-orm/core';

export interface ProjectRow {
  addedAt: Date;
  git: boolean;
  id: number;
  name: string;
  path: string;
  pinned: boolean;
  place: null | string;
  startBranch: null | string;
}

/** Dossiers ajoutés comme projets. */
export const ProjectSchema = new EntitySchema<ProjectRow>({
  name: 'Project',
  tableName: 'project',
  properties: {
    id: { type: 'integer', primary: true, autoincrement: false },
    path: { type: 'string', unique: true },
    name: { type: 'string', unique: true },
    git: { type: 'boolean' },
    pinned: { type: 'boolean', default: false },
    place: { type: 'string', nullable: true },
    startBranch: { type: 'string', nullable: true, fieldName: 'start_branch' },
    addedAt: { type: 'datetime', fieldName: 'added_at' },
  },
});

export interface IgnoredFolderRow {
  ignoredAt: Date;
  path: string;
}

/** Dossiers proposés que la personne a choisi d'ignorer. */
export const IgnoredFolderSchema = new EntitySchema<IgnoredFolderRow>({
  name: 'IgnoredFolder',
  tableName: 'ignored_folder',
  properties: {
    path: { type: 'string', primary: true },
    ignoredAt: { type: 'datetime', fieldName: 'ignored_at' },
  },
});

export interface ProjectGroupRow {
  description: null | string;
  id: number;
  instructions: string;
  name: string;
  profile: null | string;
  sidebar: boolean;
  system: boolean;
}

/** Groupes de projets, « Tous les projets » compris (system) ; leurs projets sont dans group_project. */
export const ProjectGroupSchema = new EntitySchema<ProjectGroupRow>({
  name: 'ProjectGroup',
  tableName: 'project_group',
  properties: {
    id: { type: 'integer', primary: true, autoincrement: false },
    name: { type: 'string', unique: true },
    description: { type: 'text', nullable: true },
    instructions: { type: 'text', default: '' },
    profile: { type: 'string', nullable: true },
    sidebar: { type: 'boolean', default: true },
    system: { type: 'boolean', default: false },
  },
});

export interface GroupProjectRow {
  groupId: number;
  projectId: number;
  rank: number;
}

/** Projets d'un groupe, dans l'ordre : le rang le plus petit est le projet principal. */
export const GroupProjectSchema = new EntitySchema<GroupProjectRow>({
  name: 'GroupProject',
  tableName: 'group_project',
  properties: {
    groupId: { type: 'integer', primary: true, fieldName: 'group_id' },
    projectId: { type: 'integer', primary: true, fieldName: 'project_id', index: true },
    rank: { type: 'integer' },
  },
});
