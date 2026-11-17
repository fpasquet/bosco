import { describe, expect, it } from 'vitest';
// Ce que les scénarios ne voient pas : l'ordre de la file et les tâches de l'enchaînement.
import type { TaskDto } from '@bosco/domain';
import { chainOf, sortTasks, tabOf, whyWaiting } from './tasks';

const task = (
  id: number,
  state: TaskDto['state'],
  prerequisites: number[] = [],
  createdAt = `2026-11-06T1${id % 10}:00:00Z`,
) =>
  ({
    id,
    state,
    prerequisites,
    createdAt,
    startFrom: null,
    waitingFor: prerequisites.map((p) => ({ id: p })),
  }) as TaskDto;

describe('tasks', () => {
  it('sorts the queue: to review, awaiting a session, running, queued, blocked, then the oldest first (CA-TACH-05)', () => {
    const tasks = [
      task(13, 'blocked', [12]),
      task(14, 'awaiting_session'),
      task(12, 'to_review'),
      task(16, 'queued'),
      task(17, 'queued'),
    ];
    expect(sortTasks(tasks).map(({ id }) => id)).toEqual([12, 14, 16, 17, 13]);
  });

  it('keeps the linked active tasks for the chain, and says why a task waits', () => {
    const tasks = [task(12, 'to_review'), task(13, 'blocked', [12]), task(16, 'queued'), task(10, 'validated')];
    expect(chainOf(tasks).map(({ id }) => id)).toEqual([12, 13]);
    expect([tabOf(tasks[3] as TaskDto), whyWaiting(tasks[1] as TaskDto)]).toEqual(['finished', 'attend T-12']);
  });
});
