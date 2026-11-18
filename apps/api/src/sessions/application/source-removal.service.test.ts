// Ce que les scénarios ne voient pas : un tour en cours dans une session du profil, la source tenue par Bosco, et
// l'ordre du retrait (ce qui est installé dans le profil part avant que la source soit oubliée).
import { describe, expect, it } from 'vitest';
import { ManagedSource, Source } from '../domain/source.ts';
import { UnknownSource } from './live-tracking.service.ts';
import { SourceBusy, SourceRemovalService } from './source-removal.service.ts';

const perso = Source.choose('perso', '/home/camille/.claude-perso', true);
const sandboxes = Source.manage('sandboxes', '/home/camille/.local/share/bosco/sandboxes/profile');

function removal(running: string[] = []) {
  const steps: string[] = [];
  const service = new SourceRemovalService(
    { list: () => Promise.resolve([perso, sandboxes]), save: () => Promise.resolve() },
    {
      countSessions: () => Promise.resolve({ count: 2, oldestAt: null }),
      sessionIds: () => Promise.resolve(['c41e9a07', 'a41f07c2']),
      forget: () => {
        steps.push('forget');
        return Promise.resolve();
      },
    },
    { forget: () => Promise.resolve(void steps.push('unwatch')) },
    { unwatch: () => undefined },
    {
      status: () =>
        Promise.resolve({ installed: true, outdated: false, lastSignalAt: null, mcpServer: true, settingsPath: '' }),
      uninstall: () => {
        steps.push('uninstall');
        return Promise.resolve({
          installed: false,
          outdated: false,
          lastSignalAt: null,
          mcpServer: false,
          settingsPath: '',
        });
      },
    },
    { isInstalled: () => Promise.resolve(false), uninstall: () => Promise.resolve() },
    {
      load: () => Promise.resolve(void steps.push('reload pilots')),
      replaceProfile: () => Promise.resolve(),
      runningTurns: () => running.map((sessionId) => ({ pid: null, sandboxed: false, sessionId, since: new Date(0) })),
    },
    { forgetSessions: () => undefined },
  );
  return { service, steps };
}

describe('SourceRemovalService', () => {
  it('CA-REGL-26 · refuses the removal while a turn of a session of the profile runs, and counts it', async () => {
    const { service, steps } = removal(['c41e9a07', 'other']);
    const preview = await service.previewRemoval('perso');
    expect(preview.running).toBe(1);
    await expect(service.removeSource('perso')).rejects.toThrow(SourceBusy);
    expect(steps).toEqual([]);
  });

  it('CA-REGL-24 · keeps the source of the sandboxes, kept by Bosco, and answers an unknown source', async () => {
    const { service } = removal();
    await expect(service.removeSource('sandboxes')).rejects.toThrow(ManagedSource);
    await expect(service.previewRemoval('unknown')).rejects.toThrow(UnknownSource);
  });

  it('CA-REGL-25 · takes back what Bosco installed in the profile before forgetting the source', async () => {
    const { service, steps } = removal();
    await service.removeSource('perso');
    expect(steps).toEqual(['uninstall', 'unwatch', 'forget', 'reload pilots']);
  });
});
