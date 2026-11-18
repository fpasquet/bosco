// Ce que les scénarios ne voient pas : Docker injoignable, la nouvelle tentative après 30 s, les totaux.
import { describe, expect, it } from 'vitest';
import { ContainersService } from './containers.service.ts';

function setup(options: { failing?: boolean } = {}) {
  let now = new Date('2026-11-06T15:14:00Z');
  let failing = options.failing ?? false;
  const service = new ContainersService({
    clock: { now: () => now },
    events: { containersChanged: () => undefined },
    hostCpus: 16,
    limits: { cpus: 2, memory: 4 * 1024 ** 3 },
    serviceLimits: { cpus: 1, memory: 1024 ** 3 },
    pilots: {
      list: () =>
        Promise.resolve([
          {
            cpu: 0.3,
            memory: 410 * 1024 ** 2,
            sessionId: 'c7e04a19',
            since: now,
            title: 'Tarifs : test en échec sur develop',
          },
        ]),
    },
    probe: {
      list: () =>
        failing
          ? Promise.reject(new Error('docker'))
          : Promise.resolve([
              {
                cpu: 1.7,
                key: '7ad7871f65c1',
                memory: 3.6 * 1024 ** 3,
                name: 'bosco-s-7ad7871f65c1-agent',
                service: null,
                since: null,
              },
              {
                cpu: 0.1,
                key: '7ad7871f65c1',
                memory: 60 * 1024 ** 2,
                name: 'bosco-s-7ad7871f65c1-db-1',
                service: { image: 'postgres:16.13-alpine', name: 'db', state: 'ready' as const },
                since: null,
              },
            ]),
    },
    sandboxedSessions: () =>
      Promise.resolve([
        { key: '7ad7871f65c1', project: 'api-tarifs', sessionId: '7ad7871f-65c1', title: 'TypeScript 6' },
      ]),
  });
  return {
    service,
    advance: (ms: number) => (now = new Date(now.getTime() + ms)),
    fail: (value: boolean) => (failing = value),
  };
}

describe('ContainersService', () => {
  it('measures the sandboxes against their ceiling and the piloted turns without one', async () => {
    const { service } = setup();
    const view = await service.measure();
    expect(view.sandboxes).toEqual([
      expect.objectContaining({ sessionId: '7ad7871f-65c1', title: 'TypeScript 6', cpuLimit: 2 }),
    ]);
    expect(view.totals).toEqual(expect.objectContaining({ sandboxes: 1, piloted: 1 }));
    expect(view.totals.cpu).toBeCloseTo(2.1);
  });

  it('CA-CONT-182 · lists the data services under their sandbox, against their own ceiling', async () => {
    const { service } = setup();
    const view = await service.measure();
    expect(view.sandboxes[0]).toMatchObject({ project: 'api-tarifs' });
    expect(view.sandboxes[0]?.services).toEqual([
      expect.objectContaining({ name: 'db', image: 'postgres:16.13-alpine', state: 'ready', cpuLimit: 1 }),
    ]);
  });

  it('keeps the last measures when Docker stops answering, then retries every 30 s', async () => {
    const { advance, fail, service } = setup();
    await service.measure();
    fail(true);
    const down = await service.measure();
    expect(down.unreachableSince).not.toBeNull();
    expect(down.sandboxes).toHaveLength(1);
    fail(false);
    advance(5000);
    const soon = await service.tick();
    expect(soon.unreachableSince).not.toBeNull();
    advance(30_000);
    const later = await service.tick();
    expect(later.unreachableSince).toBeNull();
  });
});
