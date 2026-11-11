// Ce que les scénarios ne voient pas : la fin de l'agent dans chaque cas, et pourquoi une tâche reste en file.
import { describe, expect, it } from 'vitest';
import type { Task } from '../domain/task.ts';
import type { AgentEvent, AgentRunner, TaskRepository } from './ports.ts';
import { DEFAULT_RIGHTS } from '../domain/rights.ts';
import { TaskService } from './task.service.ts';
import { branchOf, servicesEntry, WorkerService } from './worker.service.ts';

class MemoryTasks implements TaskRepository {
  private readonly tasks = new Map<number, Task>();
  find(id: number) {
    return Promise.resolve(this.tasks.get(id) ?? null);
  }
  list() {
    return Promise.resolve([...this.tasks.values()]);
  }
  nextId() {
    return Promise.resolve(this.tasks.size + 1);
  }
  save(tasks: readonly Task[]) {
    for (const task of tasks) this.tasks.set(task.id, task);
    return Promise.resolve();
  }
}

const usage = { input: 1_000_000, output: 0, cacheCreation: 0, cacheRead: 0 };

function setup(events: AgentEvent[], options: { budgetUsd?: number; hang?: boolean; health?: null | string } = {}) {
  const tasks = new TaskService(
    new MemoryTasks(),
    { list: () => Promise.resolve([{ name: 'api-voix', root: '/home/dev/api-voix' }]) },
    { rightsOf: () => Promise.resolve(DEFAULT_RIGHTS) },
    { tasksChanged: () => undefined },
    { now: () => new Date('2026-11-06T14:00:00Z') },
  );
  const stopped: number[] = [];
  const runner: AgentRunner = {
    start: (spec) =>
      Promise.resolve({
        events: (async function* () {
          for (const event of events) {
            await Promise.resolve();
            yield event;
          }
          // Un agent encore au travail : son flux ne se termine pas pendant le test
          if (options.hang) await new Promise(() => undefined);
        })(),
        finished: () => Promise.resolve(),
        stop: () => {
          stopped.push(spec.taskId);
          return Promise.resolve();
        },
      }),
  };
  const worker = new WorkerService({
    tasks,
    runner,
    health: { check: () => Promise.resolve(options.health ?? null) },
    freeMemory: () => 32 * 1024 ** 3,
    maxAgents: () => 4,
    contextOf: () => Promise.resolve({ text: '', versions: '' }),
    propose: () => Promise.resolve(null),
    environmentOf: () => Promise.resolve({ image: null, services: [] }),
    servicesLaunched: () => Promise.resolve(),
    priceOf: () => 1,
    rightsOf: () => Promise.resolve(DEFAULT_RIGHTS),
    claudeProfileOf: () => Promise.resolve(null),
    workspaces: {
      cleanupAll: () => Promise.resolve(),
      prepare: ({ branch }) => Promise.resolve({ branch, dir: '/var/lib/bosco/t-1' }),
      collect: () =>
        Promise.resolve({ base: 'abc123', changes: { files: 2, added: 38, removed: 4 }, from: 'main', proposals: [] }),
      remove: () => Promise.resolve(),
    },
  });
  const create = (instruction: string) =>
    tasks.create({
      repository: 'api-voix',
      folder: '',
      instruction,
      mode: 'worker',
      prerequisites: [],
      context: null,
      guardrails: { budgetUsd: options.budgetUsd ?? 1.5, maxTurns: 30, model: null, tools: null },
    });
  const settle = () => new Promise((resolve) => setTimeout(resolve, 20));
  return { create, settle, stopped, tasks, worker };
}

describe('WorkerService', () => {
  it('names the branch after the task', () => {
    expect(branchOf({ id: 12, title: 'Ajouter la prononciation de « SNCF » au lexique' })).toBe(
      'bosco/t-12-ajouter-la-prononciation-de-sncf-au-lexi',
    );
  });

  it('reports the memory available beyond the margin kept free, for the departure line (CA-TACH-78)', () => {
    const { worker } = setup([]);
    expect(worker.current()).toMatchObject({
      agentMemory: 4 * 1024 ** 3,
      availableMemory: 28 * 1024 ** 3,
      capacity: 4,
    });
  });

  it('runs a ready task, then brings it to review with its outcome', async () => {
    const { create, settle, tasks, worker } = setup([
      { kind: 'session', sessionId: 'd7f3a20e' },
      { kind: 'usage', model: 'claude-sonnet-5-5', usage },
      { kind: 'result', ok: true, report: 'Entrée ajoutée.', stop: 'success', turns: 14 },
    ]);
    await create('Ajouter la prononciation de « SNCF » au lexique.');
    await worker.tick();
    await settle();
    const task = await tasks.get(1);
    expect([task.state, task.spentUsd, task.outcome.report, task.outcome.turns, task.outcome.changes]).toEqual([
      'to_review',
      1,
      'Entrée ajoutée.',
      14,
      { files: 2, added: 38, removed: 4 },
    ]);
  });

  it('notes in the journal the place taken at the start (CA-TACH-81)', async () => {
    const { create, settle, tasks, worker } = setup([]);
    const created = await create('Ajouter la prononciation de « SNCF »');
    await worker.tick();
    await settle();
    const view = await tasks.get(created.id);
    const started = view.log.find((entry) => entry.event === 'Démarrée');
    expect(started?.detail).toMatch(/ · 1 agent sur 1 pour api-voix, 1 \/ 4$/);
  });

  it('notes the start time of each test service, or those that failed (CA-TACH-81)', () => {
    expect(
      servicesEntry([
        { error: null, image: 'mysql:8.0', name: 'database', readySeconds: 12 },
        { error: null, image: 'rabbitmq:3', name: 'rabbitmq', readySeconds: 8 },
      ]),
    ).toEqual(['Services prêts', 'database en 12 s · rabbitmq en 8 s']);
    expect(
      servicesEntry([{ error: 'pas prêt après 180 s', image: 'x', name: 'database', readySeconds: null }]),
    ).toEqual(['Services en échec', 'database : pas prêt après 180 s']);
  });

  it('stops the agent once the budget is spent', async () => {
    const { create, settle, stopped, tasks, worker } = setup(
      [
        { kind: 'usage', model: 'claude-sonnet-5-5', usage },
        { kind: 'usage', model: 'claude-sonnet-5-5', usage },
      ],
      { budgetUsd: 1.5 },
    );
    await create('Monter la version de Fastify.');
    await worker.tick();
    await settle();
    const task = await tasks.get(1);
    expect([task.state, task.failure, stopped]).toEqual(['failed', 'Budget atteint : 2,00 $ sur 1,50 $', [1]]);
  });

  it('fails a task whose agent ran out of turns', async () => {
    const { create, settle, tasks, worker } = setup([
      { kind: 'result', ok: false, report: null, stop: 'max_turns', turns: 30 },
    ]);
    await create('Monter la version de Fastify.');
    await worker.tick();
    await settle();
    const task = await tasks.get(1);
    expect(task.failure).toBe('Nombre de tours atteint : 30');
  });

  it('keeps the tasks in the queue with the reason when the worker is unavailable, or the repository busy', async () => {
    const unavailable = setup([], { health: 'Docker ne répond pas' });
    await unavailable.create('Première.');
    const down = await unavailable.worker.tick();
    expect(down.waiting).toEqual({ 1: 'Worker indisponible' });
    const busy = setup([{ kind: 'session', sessionId: 'x' }], { hang: true });
    await busy.create('Première.');
    await busy.create('Deuxième.');
    const status = await busy.worker.tick();
    expect(status.waiting).toEqual({ 2: 'api-voix : 1 agent au plus à la fois' });
  });
});
