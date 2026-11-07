import { EntitySchema } from '@mikro-orm/core';

export interface TaskRow {
  context: null | string;
  createdAt: Date;
  createdBy: string;
  failure: null | string;
  folder: string;
  guardrails: Record<string, unknown>;
  id: number;
  instruction: string;
  log: { at: string; detail: null | string; event: string }[];
  mode: string;
  prerequisites: number[];
  repositoryName: string;
  repositoryRoot: string;
  spentUsd: number;
  state: string;
  updatedAt: Date;
}

/** Tâches confiées à Claude Code (RF-TACH) ; garde-fous, préalables et journal en JSON. */
export const TaskSchema = new EntitySchema<TaskRow>({
  name: 'Task',
  tableName: 'task',
  properties: {
    id: { type: 'integer', primary: true, autoincrement: false },
    repositoryName: { type: 'string', fieldName: 'repository_name', index: true },
    repositoryRoot: { type: 'string', fieldName: 'repository_root' },
    folder: { type: 'string' },
    instruction: { type: 'text' },
    mode: { type: 'string' },
    state: { type: 'string', index: true },
    context: { type: 'string', nullable: true },
    createdBy: { type: 'string', fieldName: 'created_by' },
    failure: { type: 'string', nullable: true },
    guardrails: { type: 'json' },
    prerequisites: { type: 'json' },
    log: { type: 'json' },
    spentUsd: { type: 'double', fieldName: 'spent_usd' },
    createdAt: { type: 'datetime', fieldName: 'created_at' },
    updatedAt: { type: 'datetime', fieldName: 'updated_at' },
  },
});
