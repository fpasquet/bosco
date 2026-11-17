import { EntitySchema } from '@mikro-orm/core';

export interface ProjectRow {
  addedAt: Date;
  git: boolean;
  id: number;
  name: string;
  path: string;
  pinned: boolean;
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
