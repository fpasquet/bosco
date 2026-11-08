// Ce que les scénarios ne voient pas : les jours ouvrés de la moyenne et le cumul par dépôt et par modèle.
import { describe, expect, it } from 'vitest';
import type { SessionView } from './session.service.ts';
import { HistoryService } from './history.service.ts';

const view = (id: string, startedAt: string, usd: number, repository: null | string, model = 'claude-sonnet-5-5') =>
  ({
    id,
    startedAt: new Date(startedAt),
    cost: { usd, unpriced: false },
    repository: repository ? { name: repository, folder: '', root: `/home/dev/${repository}` } : null,
    model,
    sourceId: 'pro',
    state: 'ended',
    usage: { input: 10, output: 0, cacheCreation: 10, cacheRead: 80 },
  }) as unknown as SessionView;

const sessions = [
  view('a', '2026-11-06T10:00:00', 2, 'labo-ia'),
  view('b', '2026-11-06T15:00:00', 1, 'api-voix', 'claude-opus-5-5'),
  view('c', '2026-11-03T09:00:00', 1, 'labo-ia'),
];

function service(found: string[] = []) {
  return new HistoryService(
    { listSessions: () => Promise.resolve(sessions) },
    { search: () => Promise.resolve(new Set(found)) },
    () => new Date('2026-11-08T12:00:00'),
  );
}

const all = { from: null, query: '', repository: null, sourceId: null, state: null } as const;

describe('HistoryService', () => {
  it('groups the sessions by day, newest first, with the cost of each day (CA-SESS-49)', async () => {
    const days = await service().history(all);
    expect(days.map(({ costUsd, date, sessions: ofDay }) => [date, ofDay.map(({ id }) => id), costUsd])).toEqual([
      ['2026-11-06', ['b', 'a'], 3],
      ['2026-11-03', ['c'], 1],
    ]);
  });

  it('keeps only the sessions found by the search, and adds up the filters (CA-SESS-47, CA-SESS-48)', async () => {
    const days = await service(['a', 'c']).history({
      ...all,
      query: 'pdf',
      repository: 'labo-ia',
      from: new Date('2026-11-05'),
    });
    expect(days.flatMap((day) => day.sessions.map(({ id }) => id))).toEqual(['a']);
  });

  it('averages the cost on the working days only, and splits it by repository and by model (CA-SESS-52)', async () => {
    const report = await service().costs({ ...all, from: new Date('2026-11-02T00:00:00') });
    expect([report.totalUsd, report.workingDays, report.averagePerWorkingDayUsd, report.cacheShare]).toEqual([
      4, 5, 0.8, 80,
    ]);
    expect(report.byRepository.map(({ name, share }) => [name, share])).toEqual([
      ['labo-ia', 75],
      ['api-voix', 25],
    ]);
    expect(report.byModel.map(({ model, usd }) => [model, usd])).toEqual([
      ['claude-sonnet-5-5', 3],
      ['claude-opus-5-5', 1],
    ]);
    expect(report.days.find((day) => day.date === '2026-11-06')?.repositories).toHaveLength(2);
  });
});
