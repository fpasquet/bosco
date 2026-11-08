// Ce que les scénarios ne voient pas : chaque passage d'état, la cascade d'échecs et la relance.
import { describe, expect, it } from 'vitest';
import { TaskBoard } from './task-board.ts';
import { Task, TaskError, titleOf } from './task.ts';

const at = new Date('2026-11-06T14:00:00Z');
const guardrails = { budgetUsd: 1.5, maxTurns: 30, model: null, tools: null };

function task(
  id: number,
  prerequisites: number[] = [],
  mode: 'session' | 'worker' = 'worker',
  repository = 'api-voix',
) {
  return Task.create(
    {
      id,
      instruction: `Tâche ${id}. Détails.`,
      mode,
      prerequisites,
      folder: '',
      context: null,
      createdBy: 'person',
      guardrails,
      repository: { name: repository, root: `/home/dev/${repository}` },
    },
    at,
  );
}

describe('Task', () => {
  it('takes its title from the first sentence of its instruction', () => {
    expect(titleOf('Ajoute au lexique la prononciation des sigles du sport : PSG, OM. Ajoute un test.')).toBe(
      'Ajoute au lexique la prononciation des sigles du sport',
    );
  });

  it('starts once its prerequisites are validated, in the queue of its mode', () => {
    const worker = task(1);
    const session = task(2, [], 'session');
    worker.settle(true, at);
    session.settle(true, at);
    expect([worker.state, session.state]).toEqual(['queued', 'awaiting_session']);
  });

  it('can be edited before it starts only', () => {
    const one = task(1);
    one.settle(true, at);
    one.start(at);
    expect(() => one.edit({ instruction: 'Autre chose.' }, at)).toThrow(TaskError);
  });
});

describe('TaskBoard', () => {
  it('fails the waiting tasks in cascade, and revives them with a relaunch (RF-TACH-03, RF-TACH-08)', () => {
    const t12 = task(12);
    const t13 = task(13, [12]);
    const t15 = task(15, [13, 14], 'worker', 'labo-ia');
    const t14 = task(14, [], 'session', 'labo-ia');
    const board = new TaskBoard([t12, t13, t14, t15]);
    board.settleAll(at);
    expect([t12.state, t13.state, t14.state, t15.state]).toEqual(['queued', 'blocked', 'awaiting_session', 'blocked']);
    t12.start(at);
    t12.fail('Budget atteint', at);
    expect(board.cascade(12, 'en échec', at).map(({ id }) => id)).toEqual([13, 15]);
    expect(t15.toSnapshot().failure).toBe('Préalable T-12 en échec');
    t12.relaunch(guardrails, at, 'depuis la branche');
    expect(board.revive(12, at).map(({ id }) => id)).toEqual([13, 15]);
    board.settleAll(at);
    expect([t12.state, t13.state, t15.state]).toEqual(['queued', 'blocked', 'blocked']);
  });

  it('refuses to wait for a failed task, an unknown one, or a cycle', () => {
    const t9 = task(9);
    t9.settle(true, at);
    t9.start(at);
    t9.fail('Budget atteint', at);
    const t2 = task(2, [3]);
    const t3 = task(3);
    const board = new TaskBoard([t9, t2, t3]);
    expect(() => board.checkPrerequisites([9])).toThrow(/failed/);
    expect(() => board.checkPrerequisites([99])).toThrow(/No task/);
    expect(() => board.checkPrerequisites([2], 3)).toThrow(/waits for it/);
  });

  it('undoes a cancellation in the seconds that follow, back to its queue (CA-TACH-71)', () => {
    const queued = task(4);
    queued.settle(true, at);
    queued.cancel(at);
    queued.undoCancel(new Date(at.getTime() + 5000));
    new TaskBoard([queued]).settleAll(at);
    expect([queued.state, queued.toSnapshot().failure, queued.toSnapshot().log.at(-2)?.event]).toEqual([
      'queued',
      null,
      'Annulation annulée',
    ]);
  });

  it('keeps a cancellation once the delay has passed, or once the agent had started', () => {
    const late = task(5);
    late.cancel(at);
    expect(() => late.undoCancel(new Date(at.getTime() + 16_000))).toThrow(TaskError);
    const started = task(6);
    started.settle(true, at);
    started.start(at);
    started.cancel(at);
    expect(() => started.undoCancel(at)).toThrow(/had started/);
    expect(() => task(7).undoCancel(at)).toThrow(/not just cancelled/);
  });
});
