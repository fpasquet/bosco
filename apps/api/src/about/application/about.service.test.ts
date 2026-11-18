// Temps exact de la recherche automatique (une par jour au plus) et annonce d'une mise à jour d'un lancement à
// l'autre : les scénarios ne font pas passer les jours.
import { describe, expect, it } from 'vitest';
import type { PublishedRelease } from '../domain/release.ts';
import type { BuildInfo, ReleaseFeed, UpdateState, UpdateStore } from './ports.ts';
import { AboutService, CHECK_INTERVAL_MS } from './about.service.ts';

class MemoryStore implements UpdateStore {
  state: null | UpdateState = null;

  load(): Promise<UpdateState> {
    return Promise.resolve(
      this.state ?? {
        enabled: true,
        channel: null,
        checkedAt: null,
        latest: null,
        error: null,
        lastRunVersion: null,
        installedNotice: null,
        dismissed: null,
      },
    );
  }

  save(state: UpdateState): Promise<void> {
    this.state = structuredClone(state);
    return Promise.resolve();
  }
}

class CountingFeed implements ReleaseFeed {
  calls = 0;
  releases: PublishedRelease[] = [];

  list(): Promise<PublishedRelease[]> {
    this.calls += 1;
    return Promise.resolve(this.releases);
  }
}

function setup(version = '0.2.0') {
  const now = { value: new Date('2026-11-20T08:00:00Z') };
  const build: { info: BuildInfo } = { info: { version, commit: null, release: true, install: 'deb' } };
  const store = new MemoryStore();
  const feed = new CountingFeed();
  const service = () =>
    new AboutService(
      { current: () => build.info },
      feed,
      store,
      { read: () => Promise.resolve('') },
      {
        now: () => now.value,
      },
    );
  return { build, feed, now, service, store };
}

describe('AboutService', () => {
  it('CA-REGL-36 · looks for a new version at most once a day, and not at all when turned off', async () => {
    const { feed, now, service } = setup();
    const about = service();
    await about.checkIfDue();
    await about.checkIfDue();
    expect(feed.calls).toBe(1);
    now.value = new Date(now.value.getTime() + CHECK_INTERVAL_MS - 1);
    await about.checkIfDue();
    expect(feed.calls).toBe(1);
    now.value = new Date(now.value.getTime() + 1);
    await about.checkIfDue();
    expect(feed.calls).toBe(2);
    await about.choose({ enabled: false, channel: 'stable' });
    now.value = new Date(now.value.getTime() + 2 * CHECK_INTERVAL_MS);
    await about.checkIfDue();
    expect(feed.calls).toBe(2);
  });

  it('CA-REGL-37 · announces the installed version once, after a launch on another version, never on the first launch', async () => {
    const { build, service } = setup('0.1.0');
    await service().load();
    const first = await service().describe();
    expect(first.installed).toBeNull();
    build.info = { ...build.info, version: '0.2.0' };
    const updated = service();
    await updated.load();
    const announced = await updated.describe();
    expect(announced.installed).toBe('0.2.0');
    await updated.dismiss('installed', '0.2.0');
    const next = service();
    await next.load();
    const later = await next.describe();
    expect(later.installed).toBeNull();
  });

  it('keeps the error of a failed check, and tries again the next day', async () => {
    const { feed, now, service } = setup();
    feed.list = () => {
      feed.calls += 1;
      return Promise.reject(new Error('GitHub answered 503'));
    };
    const about = service();
    await about.checkIfDue();
    const failed = await about.describe();
    expect(failed.updates.error).toBe('GitHub answered 503');
    now.value = new Date(now.value.getTime() + CHECK_INTERVAL_MS);
    await about.checkIfDue();
    expect(feed.calls).toBe(2);
  });
});
