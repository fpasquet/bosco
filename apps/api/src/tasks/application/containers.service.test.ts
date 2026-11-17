import { describe, expect, it } from 'vitest';
import type { ContainerSample } from '../domain/containers.ts';
import type { TaskView } from './task.service.ts';
import { type ContainerProbe, ContainersService, type ContainersView, RETRY_MS } from './containers.service.ts';

const GB = 1024 ** 3;
const MB = 1024 ** 2;
const START = new Date('2026-11-06T15:13:00Z');

function task(id: number, state: TaskView['state'], updatedAt = START): TaskView {
  return { id, repository: { name: 'api-voix', root: '/r' }, state, title: `Tâche ${id}`, updatedAt } as TaskView;
}

function sample(name: string, overrides: Partial<ContainerSample> = {}): ContainerSample {
  const match = /^bosco-t(\d+)(?:-svc-(.+))?$/.exec(name);
  return {
    cpu: 0.4,
    image: match?.[2] ? 'mysql:8.0' : 'bosco-agent:1',
    kind: match?.[2] ? 'service' : 'agent',
    memory: 1.1 * GB,
    name,
    running: true,
    service: match?.[2] ?? null,
    taskId: Number(match?.[1]),
    ...overrides,
  };
}

function setup(tasks: TaskView[], samples: ContainerSample[]) {
  let now = START;
  let reachable = true;
  const journal: { detail: string; event: string; id: number }[] = [];
  const removed: string[] = [];
  const views: ContainersView[] = [];
  const probe: ContainerProbe = {
    diskOf: (names) => Promise.resolve(names.length * 600 * MB),
    list: () => (reachable ? Promise.resolve(samples) : Promise.reject(new Error('down'))),
    logs: () => Promise.resolve('ready for connections'),
    remove: (names) => {
      removed.push(...names);
      samples = samples.filter((item) => !names.includes(item.name));
      return Promise.resolve();
    },
    restart: (name) => Promise.resolve(name.endsWith('rabbitmq') ? 'pas prêt après 180 s' : null),
  };
  const service = new ContainersService({
    clock: { now: () => now },
    events: { containersChanged: (view) => views.push(view) },
    hostCpus: 16,
    pilots: {
      list: () =>
        Promise.resolve([
          { cpu: 0.3, memory: 410 * MB, sessionId: 's1', since: START, title: 'Lexique : test en échec sur develop' },
        ]),
    },
    probe,
    tasks: {
      list: () => Promise.resolve(tasks),
      record: (id, event, detail) => {
        journal.push({ detail, event, id });
        return Promise.resolve(tasks[0]!);
      },
    },
    worker: {
      current: () => ({
        agentMemory: 4 * GB,
        availableMemory: 22.3 * GB,
        capacity: 4,
        running: 2,
        unavailable: null,
        waiting: {},
      }),
    },
  });
  return {
    advance: (ms: number) => {
      now = new Date(now.getTime() + ms);
    },
    journal,
    removed,
    service,
    setReachable: (value: boolean) => {
      reachable = value;
    },
    setSamples: (next: ContainerSample[]) => {
      samples = next;
    },
    views,
  };
}

describe('ContainersService', () => {
  it('groups the agents, their test services and the piloted turns, with their ceilings (CA-CONT-72)', async () => {
    const { service } = setup(
      [task(17, 'running'), task(18, 'running')],
      [
        sample('bosco-t18', { cpu: 1.7, memory: 3.6 * GB }),
        sample('bosco-t17'),
        sample('bosco-t17-svc-database', { cpu: 0.1, memory: 412 * MB }),
        sample('bosco-t17-egress', { kind: 'proxy' }),
      ],
    );
    const view = await service.measure();
    expect(view.agents.map(({ taskId }) => taskId)).toEqual([18, 17]);
    expect(view.agents[0]).toMatchObject({ cpu: 1.7, cpuLimit: 2, memoryLimit: 4 * GB, title: 'Tâche 18' });
    expect(view.agents[1]!.services).toEqual([
      expect.objectContaining({ cpuLimit: 1, memoryLimit: GB, service: 'database', state: 'running' }),
    ]);
    expect(view.piloted).toEqual([expect.objectContaining({ cpuLimit: null, memoryLimit: null, sessionId: 's1' })]);
    expect(view.totals).toMatchObject({ agents: 2, piloted: 1, services: 1 });
    expect(view.totals.memory).toBeCloseTo(3.6 * GB + 1.1 * GB + 412 * MB + 410 * MB);
    expect(view.capacity).toEqual({ availableMemory: 22.3 * GB, maxAgents: 4, reservedMemory: 4 * GB, running: 2 });
  });

  it('sets apart a container left after its task, out of the totals, with the disk it takes (CA-CONT-83, 85)', async () => {
    const { service } = setup(
      [task(9, 'failed', new Date(START.getTime() - 3600_000)), task(12, 'to_review')],
      [
        sample('bosco-t9', { running: false }),
        sample('bosco-t9-svc-database', { running: false }),
        sample('bosco-t12'),
      ],
    );
    const view = await service.measure();
    expect(view.leftovers.map(({ name }) => name)).toEqual(['bosco-t9', 'bosco-t9-svc-database']);
    expect(view.leftoversDisk).toBe(1200 * MB);
    // T-12 vient de finir : le worker supprime encore ses conteneurs, ce n'est pas un reste
    expect(view.agents.map(({ taskId }) => taskId)).toEqual([12]);
    expect(view.totals.agents).toBe(1);
  });

  it('removes the leftovers on cleanup and plans the next one in an hour (CA-CONT-84)', async () => {
    const { removed, service } = setup(
      [task(9, 'failed', new Date(START.getTime() - 3600_000))],
      [sample('bosco-t9', { running: false })],
    );
    await service.cleanup();
    expect(removed).toEqual(['bosco-t9']);
    expect(service.current().leftovers).toEqual([]);
    expect(service.current().nextCleanupAt).toEqual(new Date(START.getTime() + 3600_000));
  });

  it('removes one leftover at a time, and refuses a container that is not a leftover', async () => {
    const { removed, service } = setup(
      [task(9, 'cancelled', new Date(START.getTime() - 3600_000)), task(17, 'running')],
      [sample('bosco-t9', { running: false }), sample('bosco-t17')],
    );
    await service.measure();
    await expect(service.removeLeftovers('bosco-t17')).rejects.toThrow('No such container');
    await service.removeLeftovers('bosco-t9');
    expect(removed).toEqual(['bosco-t9']);
  });

  it('keeps the last measures, dated, when Docker stops answering, and retries every 30 s (CA-CONT-80 to 82)', async () => {
    const { advance, service, setReachable } = setup([task(18, 'running')], [sample('bosco-t18')]);
    await service.measure();
    setReachable(false);
    advance(5000);
    const down = await service.measure();
    expect(down.unreachableSince).toEqual(new Date(START.getTime() + 5000));
    expect(down.measuredAt).toEqual(START);
    expect(down.agents).toHaveLength(1);
    setReachable(true);
    advance(5000);
    const tooSoon = await service.tick();
    expect(tooSoon.unreachableSince).not.toBeNull();
    advance(RETRY_MS);
    const retried = await service.tick();
    expect(retried.unreachableSince).toBeNull();
  });

  it('restarts a test service and notes it in the journal of its task (CA-CONT-78)', async () => {
    const { journal, service, views } = setup(
      [task(17, 'running')],
      [sample('bosco-t17'), sample('bosco-t17-svc-database')],
    );
    await service.measure();
    await service.restartService('bosco-t17-svc-database');
    expect(views.some((view) => view.agents[0]?.services[0]?.state === 'restarting')).toBe(true);
    expect(service.current().agents[0]!.services[0]!.state).toBe('running');
    expect(journal).toEqual([{ detail: 'database', event: 'Service redémarré', id: 17 }]);
  });

  it('marks a service that did not answer after its restart as failed (CA-CONT-79)', async () => {
    const { journal, service } = setup([task(17, 'running')], [sample('bosco-t17'), sample('bosco-t17-svc-rabbitmq')]);
    await service.measure();
    await service.restartService('bosco-t17-svc-rabbitmq');
    expect(service.current().agents[0]!.services[0]!.state).toBe('failed');
    expect(journal[0]).toMatchObject({ event: 'Service en échec après redémarrage', id: 17 });
  });

  it('refuses to restart an agent: an agent stops, it does not restart (CA-CONT-77)', async () => {
    const { service } = setup([task(17, 'running')], [sample('bosco-t17')]);
    await service.measure();
    await expect(service.restartService('bosco-t17')).rejects.toThrow('No such container');
  });

  it('notes the memory peak of the agent and of each service once the task is over (CA-TACH-82)', async () => {
    const tasks = [task(17, 'running')];
    const { journal, service, setSamples } = setup(tasks, [
      sample('bosco-t17', { memory: 2 * GB }),
      sample('bosco-t17-svc-database', { memory: 300 * MB }),
    ]);
    await service.measure();
    setSamples([sample('bosco-t17', { memory: 1.2 * GB }), sample('bosco-t17-svc-database', { memory: 412 * MB })]);
    await service.measure();
    setSamples([]);
    tasks[0] = task(17, 'to_review');
    await service.measure();
    expect(journal).toEqual([{ detail: 'agent 2,0 Go · database 412 Mo', event: 'Pic de mémoire', id: 17 }]);
  });
});
