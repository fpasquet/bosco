import type { MikroORM } from '@mikro-orm/sqlite';
import type { TaskRepository } from '../../application/ports.ts';
import { type Guardrails, Task, type TaskMode, type TaskOutcome, type TaskState } from '../../domain/task.ts';
import { type TaskRow, TaskSchema } from './task.schema.ts';

function toTask(row: TaskRow): Task {
  return Task.restore({
    id: row.id,
    repository: { name: row.repositoryName, root: row.repositoryRoot },
    folder: row.folder,
    instruction: row.instruction,
    mode: row.mode as TaskMode,
    state: row.state as TaskState,
    context: row.context,
    createdBy: row.createdBy === 'session' ? 'session' : 'person',
    failure: row.failure,
    guardrails: row.guardrails as unknown as Guardrails,
    prerequisites: row.prerequisites,
    log: row.log.map((entry) => ({ ...entry, at: new Date(entry.at) })),
    outcome: {
      branch: null,
      changes: null,
      report: null,
      sessionId: null,
      turns: 0,
      ...(row.outcome as Partial<TaskOutcome>),
    },
    spentUsd: row.spentUsd,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export class MikroOrmTaskRepository implements TaskRepository {
  constructor(private readonly orm: MikroORM) {}

  async find(id: number): Promise<null | Task> {
    const row = await this.orm.em.fork().findOne(TaskSchema, { id });
    return row ? toTask(row) : null;
  }

  async list(): Promise<Task[]> {
    const rows = await this.orm.em.fork().find(TaskSchema, {}, { orderBy: { id: 'asc' } });
    return rows.map(toTask);
  }

  async nextId(): Promise<number> {
    const [last] = await this.orm.em.fork().find(TaskSchema, {}, { orderBy: { id: 'desc' }, limit: 1 });
    return (last?.id ?? 0) + 1;
  }

  async save(tasks: readonly Task[]): Promise<void> {
    const em = this.orm.em.fork();
    for (const task of tasks) {
      const { repository, log, guardrails, outcome, ...snapshot } = task.toSnapshot();
      await em.upsert(TaskSchema, {
        ...snapshot,
        repositoryName: repository.name,
        repositoryRoot: repository.root,
        guardrails: { ...guardrails },
        outcome: { ...outcome },
        log: log.map((entry) => ({ ...entry, at: entry.at.toISOString() })),
      });
    }
  }
}
