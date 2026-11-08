import { EntitySchema } from '@mikro-orm/core';

export interface DecisionRow {
  exceptionTo: null | number;
  fromTask: null | number;
  id: number;
  reason: null | string;
  replacedBy: null | number;
  specifies: number[];
  state: string;
  target: Record<string, unknown>;
  versions: Record<string, unknown>[];
}

/** Décisions des dépôts et des socles (RF-CONT-01) ; versions et cible en JSON. */
export const DecisionSchema = new EntitySchema<DecisionRow>({
  name: 'Decision',
  tableName: 'decision',
  properties: {
    id: { type: 'integer', primary: true, autoincrement: false },
    state: { type: 'string', index: true },
    target: { type: 'json' },
    exceptionTo: { type: 'integer', nullable: true, fieldName: 'exception_to' },
    fromTask: { type: 'integer', nullable: true, fieldName: 'from_task' },
    reason: { type: 'text', nullable: true },
    replacedBy: { type: 'integer', nullable: true, fieldName: 'replaced_by' },
    specifies: { type: 'json' },
    versions: { type: 'json' },
  },
});

export interface SocleRow {
  id: number;
  inherits: null | number;
  name: string;
  repositories: string[];
  scope: string;
}

/** Socles de décisions communes à plusieurs dépôts (RF-CONT-03). */
export const SocleSchema = new EntitySchema<SocleRow>({
  name: 'Socle',
  tableName: 'socle',
  properties: {
    id: { type: 'integer', primary: true, autoincrement: false },
    name: { type: 'string' },
    scope: { type: 'string' },
    inherits: { type: 'integer', nullable: true },
    repositories: { type: 'json' },
  },
});

export interface LinkRow {
  error: null | string;
  id: number;
  kind: string;
  person: null | string;
  readAt: Date | null;
  service: string;
  state: null | string;
  taskId: number;
  title: string;
  url: string;
}

/** Liens des tâches (RF-CONT-04) : l'adresse et ce que Bosco en a lu, jamais le contenu. */
export const LinkSchema = new EntitySchema<LinkRow>({
  name: 'Link',
  tableName: 'link',
  properties: {
    id: { type: 'integer', primary: true, autoincrement: false },
    taskId: { type: 'integer', fieldName: 'task_id', index: true },
    url: { type: 'text' },
    service: { type: 'string' },
    kind: { type: 'string' },
    title: { type: 'text' },
    state: { type: 'string', nullable: true },
    person: { type: 'string', nullable: true },
    readAt: { type: 'datetime', nullable: true, fieldName: 'read_at' },
    error: { type: 'text', nullable: true },
  },
});
