// Ce que les scénarios ne voient pas : chaque cumul des filtres et le total de chaque jour.
import { describe, expect, it } from 'vitest';
import type { SessionView } from './session.service.ts';
import { HistoryService } from './history.service.ts';

const view = (id: string, startedAt: string, usd: number, project: null | string, model = 'claude-sonnet-5-5') =>
  ({
    id,
    startedAt: new Date(startedAt),
    cost: { usd, unpriced: false },
    project: project
      ? { id: project === 'maison' ? 1 : 2, name: project, folder: '', root: `/home/dev/${project}` }
      : null,
    addedProjects: [],
    model,
    sourceId: 'pro',
    state: 'ended',
    usage: { input: 10, output: 0, cacheCreation: 10, cacheRead: 80 },
  }) as unknown as SessionView;

const sessions = [
  view('a', '2026-11-06T10:00:00', 2, 'maison'),
  view('b', '2026-11-06T15:00:00', 1, 'site-perso', 'claude-opus-5-5'),
  view('c', '2026-11-03T09:00:00', 1, 'maison'),
  {
    ...view('d', '2026-11-02T09:00:00', 1, 'maison'),
    addedProjects: [{ id: 3, name: 'outils', root: '/home/dev/outils' }],
  },
];

function service(found: string[] = []) {
  return new HistoryService(
    {
      listSessions: () => Promise.resolve(sessions),
      knownGroups: () => Promise.resolve([{ id: 2, name: 'Perso', projects: [2, 3], defaults: {} as never }]),
    },
    { search: () => Promise.resolve(new Set(found)) },
  );
}

const all = { from: null, groupId: null, query: '', project: null, sourceId: null, state: null } as const;

describe('HistoryService', () => {
  it('groups the sessions by day, newest first, with the cost of each day (CA-SESS-49)', async () => {
    const days = await service().history(all);
    expect(days.map(({ costUsd, date, sessions: ofDay }) => [date, ofDay.map(({ id }) => id), costUsd])).toEqual([
      ['2026-11-06', ['b', 'a'], 3],
      ['2026-11-03', ['c'], 1],
      ['2026-11-02', ['d'], 1],
    ]);
  });

  it('keeps only the sessions found by the search, and adds up the filters (CA-SESS-47, CA-SESS-48)', async () => {
    const days = await service(['a', 'c']).history({
      ...all,
      query: 'pdf',
      project: 'maison',
      from: new Date('2026-11-05'),
    });
    expect(days.flatMap((day) => day.sessions.map(({ id }) => id))).toEqual(['a']);
  });

  it('keeps the sessions of every project of a group, those over several projects included (CA-SESS-127)', async () => {
    const days = await service().history({ ...all, groupId: 2 });
    expect(days.flatMap((day) => day.sessions.map(({ id }) => id))).toEqual(['b', 'd']);
  });
});
