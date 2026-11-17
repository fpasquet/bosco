// Ce que les scénarios ne voient pas : chaque passage d'état, la cascade d'échecs, la relance et les gardes de la
// reprise à la relecture.
import { describe, expect, it } from 'vitest';
import { TaskBoard } from './task-board.ts';
import { pendingResume, Task, TaskError, titleOf } from './task.ts';

const at = new Date('2026-11-06T14:00:00Z');
const guardrails = { maxTurns: 30, model: null, tools: null };

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

  describe('resume at review', () => {
    function reviewed(spentUsd = 0.41, turns = 14) {
      const reviewed = task(1);
      reviewed.settle(true, at);
      reviewed.start(at);
      reviewed.finish(spentUsd, { branch: 'bosco/t-1-tache-1', sessionId: 'a41f07c2', turns }, at);
      return reviewed;
    }

    it('CA-TACH-89 · goes back to the queue with the message kept in its log', () => {
      const resumed = reviewed();
      resumed.resume('Ajoute la variante avec points.', guardrails, at);
      expect(resumed.state).toBe('queued');
      expect(pendingResume(resumed.toSnapshot().log)).toBe('Ajoute la variante avec points.');
    });

    it('forgets the message once the agent has started again', () => {
      const resumed = reviewed();
      resumed.resume('Ajoute la variante avec points.', guardrails, at);
      resumed.start(at);
      expect(pendingResume(resumed.toSnapshot().log)).toBeNull();
    });

    it('CA-TACH-98 · refuses once the turns are spent, unless their cap is raised', () => {
      expect(() => reviewed(0.41, 30).resume('Encore.', guardrails, at)).toThrow(TaskError);
      const raised = reviewed(0.41, 30);
      raised.resume('Encore.', { ...guardrails, maxTurns: 60 }, at);
      expect(raised.state).toBe('queued');
    });

    it('only resumes a worker task to review that has a session', () => {
      const running = task(2);
      running.settle(true, at);
      running.start(at);
      expect(() => running.resume('Encore.', guardrails, at)).toThrow(TaskError);
      const sessionless = task(3);
      sessionless.settle(true, at);
      sessionless.start(at);
      sessionless.finish(0.1, { branch: 'bosco/t-3-tache-3' }, at);
      expect(() => sessionless.resume('Encore.', guardrails, at)).toThrow(TaskError);
    });
  });
});
