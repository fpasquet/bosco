// Ce que les scénarios ne voient pas : chaque calcul des agrégats de la page Usage, au centième près, et les cas rares
// (modèle sans tarif, petits projets regroupés, tours à cheval sur deux jours).
import { describe, expect, it } from 'vitest';
import type { PilotRecord } from './pilot.service.ts';
import type { RecordedPullRequest, RecordedTurn } from './ports.ts';
import type { SessionView } from './session.service.ts';
import type { UsageFilters } from './usage.service.ts';
import { TokenUsage } from '../domain/token-usage.ts';
import { UsageService, workSeconds } from './usage.service.ts';

const NOW = new Date('2026-11-17T15:00:00');

function view(id: string, project: null | number, added: number[] = [], sourceId = 'pro'): SessionView {
  return {
    id,
    sourceId,
    project: project === null ? null : { id: project, name: `projet-${project}`, folder: '', root: `/p/${project}` },
    addedProjects: added.map((other) => ({ id: other, name: `projet-${other}`, root: `/p/${other}` })),
  } as unknown as SessionView;
}

function turn(
  sessionId: string,
  at: string,
  model: string,
  usage: [number, number, number, number],
  subagent = false,
): RecordedTurn {
  return { sessionId, at: new Date(at), model, subagent, usage: new TokenUsage(...usage) };
}

function pilot(sessionId: string, since: string, sandbox: null | { retrievedAt: null | string } = null): PilotRecord {
  return {
    sessionId,
    since: new Date(since),
    sandbox: sandbox && { retrievedAt: sandbox.retrievedAt ? new Date(sandbox.retrievedAt) : null, copies: [] },
  } as unknown as PilotRecord;
}

interface Data {
  activity?: { at: Date; kind: string; sessionId: string }[];
  pilots?: PilotRecord[];
  pullRequests?: RecordedPullRequest[];
  turns: RecordedTurn[];
  views: SessionView[];
}

function service({ activity = [], pilots = [], pullRequests = [], turns, views }: Data) {
  const since = (from: Date | null) => (at: Date) => !from || at >= from;
  return new UsageService(
    {
      firstTurnAt: () => Promise.resolve(turns[0]?.at ?? null),
      listTurns: (from) => Promise.resolve(turns.filter((entry) => since(from)(entry.at))),
      listPullRequests: (from) => Promise.resolve(pullRequests.filter((entry) => since(from)(entry.at))),
      listActivity: (from) => Promise.resolve(activity.filter((entry) => since(from)(entry.at))),
    },
    {
      listSessions: () => Promise.resolve(views),
      knownGroups: () =>
        Promise.resolve([{ id: 1, name: 'Club des Trois Lacs', projects: [1, 2, 3], defaults: {} as never }]),
      knownProjects: () => Promise.resolve([]),
    },
    {
      list: () =>
        Promise.resolve([
          { id: 'pro', label: 'pro' },
          { id: 'perso', label: 'perso' },
        ] as never),
    },
    { list: () => Promise.resolve(pilots) },
    { now: () => NOW },
  );
}

const all: UsageFilters = { days: 30, groupId: null, model: null, projectId: null, sourceId: null };

describe('UsageService', () => {
  it('CA-SESS-178 · computes the cache reuse, the turns without cache read and the cost at the public price', async () => {
    const report = await service({
      views: [view('a', 1)],
      turns: [
        // Sonnet 5.5 : entrée 2 $, sortie 10 $, écriture 2,5 $, lecture 0,2 $ le million
        turn('a', '2026-11-16T10:00:00', 'claude-sonnet-5-5', [1_000_000, 100_000, 0, 0]),
        turn('a', '2026-11-16T10:01:00', 'claude-sonnet-5-5', [0, 100_000, 1_000_000, 9_000_000]),
      ],
    }).usageReport(all);
    expect(report.tokens).toMatchObject({
      input: 1_000_000,
      output: 200_000,
      cacheRead: 9_000_000,
      cacheCreation: 1_000_000,
      cacheReuse: 90,
      turnsWithoutCacheRead: 50,
      sessions: 1,
      turns: 2,
      unpricedModels: [],
    });
    expect(report.tokens.costUsd).toBeCloseTo(2 + 2 + 2.5 + 1.8);
  });

  it('CA-SESS-188 · counts the subagents in the tokens and the cost, at their own price, and shows their share', async () => {
    const report = await service({
      views: [view('a', 1)],
      turns: [
        // Session sur Opus 5.5 (sortie 20 $ le million), sous-agent sur Sonnet 5.5 (sortie 10 $ le million)
        turn('a', '2026-11-16T10:00:00', 'claude-opus-5-5', [0, 100_000, 0, 1_000_000]),
        turn('a', '2026-11-16T10:01:00', 'claude-sonnet-5-5', [0, 300_000, 0, 0], true),
        turn('a', '2026-11-16T10:02:00', 'claude-sonnet-5-5', [0, 100_000, 0, 0], true),
      ],
    }).usageReport(all);
    // Opus : 100 000 en sortie (2 $) et 1 M de cache lu à 0,2 $ ; Sonnet : 400 000 en sortie (4 $)
    expect(report.tokens.costUsd).toBeCloseTo(6.2);
    expect(report.tokens.subagents).toEqual({ costUsd: 4, tokens: 400_000 });
    expect(report.tokens).toMatchObject({ output: 500_000, turns: 1, turnsWithoutCacheRead: 0, sessions: 1 });
    expect(report.byOrigin.map(({ key, share, usd }) => [key, usd, share])).toEqual([
      ['origin:sessions', 2.2, 35.5],
      ['origin:subagents', 4, 64.5],
    ]);
    expect(report.byModel.map(({ label, usd }) => [label, usd])).toEqual([
      ['claude-sonnet-5-5', 4],
      ['claude-opus-5-5', 2.2],
    ]);
  });

  it('CA-SESS-178 · leaves a model without a known price out of the cost, and names it', async () => {
    const report = await service({
      views: [view('a', 1)],
      turns: [
        turn('a', '2026-11-16T10:00:00', 'claude-sonnet-5-5', [1_000_000, 0, 0, 0]),
        turn('a', '2026-11-16T11:00:00', 'claude-nova-1', [5_000_000, 0, 0, 0]),
      ],
    }).usageReport(all);
    expect([report.tokens.input, report.tokens.costUsd, report.tokens.unpricedModels]).toEqual([
      6_000_000,
      2,
      ['claude-nova-1'],
    ]);
    expect(report.byModel.map(({ label, share, usd }) => [label, usd, share])).toEqual([
      ['claude-sonnet-5-5', 2, 100],
      ['claude-nova-1', null, 0],
    ]);
  });

  it('CA-SESS-184 · counts a session for each project of the group it touches, but once in the totals', async () => {
    const report = await service({
      views: [view('tarifs', 1, [3]), view('recap', 2), view('logger', 9)],
      turns: [
        turn('tarifs', '2026-11-16T10:00:00', 'claude-sonnet-5-5', [1_000_000, 0, 0, 0]),
        turn('recap', '2026-11-16T11:00:00', 'claude-sonnet-5-5', [500_000, 0, 0, 0]),
        turn('logger', '2026-11-16T12:00:00', 'claude-sonnet-5-5', [500_000, 0, 0, 0]),
      ],
    }).usageReport({ ...all, groupId: 1 });
    expect([report.tokens.costUsd, report.tokens.sessions]).toEqual([3, 2]);
    expect(report.byProject.map(({ label, share, usd }) => [label, usd, share])).toEqual([
      ['projet-1', 2, 66.7],
      ['projet-3', 2, 66.7],
      ['projet-2', 1, 33.3],
    ]);
  });

  it('gathers the smaller projects in « autres » beyond five, and the sessions outside any project apart', async () => {
    const views = [1, 2, 3, 4, 5, 6, 7].map((project) => view(`s${project}`, project));
    const report = await service({
      views: [...views, view('loose', null)],
      turns: [
        ...views.map((entry, index) =>
          turn(entry.id, '2026-11-16T10:00:00', 'claude-sonnet-5-5', [(7 - index) * 100_000, 0, 0, 0]),
        ),
        turn('loose', '2026-11-16T10:00:00', 'claude-sonnet-5-5', [50_000, 0, 0, 0]),
      ],
    }).usageReport(all);
    expect(report.byProject.map(({ count, key }) => [key, count])).toEqual([
      ['project:1', undefined],
      ['project:2', undefined],
      ['project:3', undefined],
      ['project:4', undefined],
      ['project:5', undefined],
      ['others', 3],
    ]);
    expect(report.byProject.at(-1)?.label).toBe('3 autres');
  });

  it('gives one bar per day of the period, today included, with the tokens and the cost of each series', async () => {
    const report = await service({
      views: [view('a', 1)],
      turns: [
        turn('a', '2026-11-10T23:50:00', 'claude-sonnet-5-5', [1_000_000, 0, 0, 0]),
        turn('a', '2026-11-17T00:10:00', 'claude-sonnet-5-5', [0, 0, 0, 1_000_000]),
      ],
    }).usageReport({ ...all, days: 7 });
    expect(report.days.map(({ date }) => date)).toEqual([
      '2026-11-11',
      '2026-11-12',
      '2026-11-13',
      '2026-11-14',
      '2026-11-15',
      '2026-11-16',
      '2026-11-17',
    ]);
    expect(report.days.at(-1)?.tokens.cacheRead).toBe(1_000_000);
    expect(report.days.at(-1)?.cost.cacheRead).toBeCloseTo(0.2);
    expect(report.tokens.input).toBe(0);
  });

  it('filters on a profile and on a model, and keeps the models of the period for the filter', async () => {
    const report = await service({
      views: [view('a', 1), view('b', 1, [], 'perso')],
      turns: [
        turn('a', '2026-11-16T10:00:00', 'claude-opus-5-5-20261001', [1_000_000, 0, 0, 0]),
        turn('a', '2026-11-16T10:05:00', 'claude-sonnet-5-5', [1_000_000, 0, 0, 0]),
        turn('b', '2026-11-16T11:00:00', 'claude-sonnet-5-5', [1_000_000, 0, 0, 0]),
      ],
    }).usageReport({ ...all, sourceId: 'pro', model: 'claude-opus-5-5' });
    expect([report.tokens.turns, report.tokens.costUsd, report.models]).toEqual([
      1,
      4,
      ['claude-opus-5-5', 'claude-sonnet-5-5'],
    ]);
  });

  it('CA-SESS-177 · counts the piloted sessions, sandboxes, retrieved branches and pull requests of the period', async () => {
    const report = await service({
      views: [view('a', 1), view('b', 2), view('old', 1)],
      turns: [],
      pilots: [
        pilot('a', '2026-11-16T10:00:00', { retrievedAt: '2026-11-16T12:00:00' }),
        pilot('b', '2026-11-15T10:00:00'),
        pilot('old', '2026-09-01T10:00:00', { retrievedAt: '2026-09-02T10:00:00' }),
      ],
      pullRequests: [
        { at: new Date('2026-11-16T12:30:00'), sessionId: 'a', url: 'https://github.com/clubs/api-tarifs/pull/27' },
      ],
    }).usageReport(all);
    expect(report.activity).toMatchObject({ pilotedSessions: 2, sandboxes: 1, retrievedBranches: 1, pullRequests: 1 });
  });
});

describe('workSeconds', () => {
  it('adds each turn from the prompt to the last entry before the next prompt, session by session', () => {
    const at = (time: string) => new Date(`2026-11-16T${time}`);
    expect(
      workSeconds([
        { sessionId: 'a', kind: 'prompt', at: at('10:00:00') },
        { sessionId: 'a', kind: 'tool', at: at('10:01:00') },
        { sessionId: 'a', kind: 'reply', at: at('10:02:00') },
        { sessionId: 'a', kind: 'prompt', at: at('11:00:00') },
        { sessionId: 'a', kind: 'reply', at: at('11:00:30') },
        { sessionId: 'b', kind: 'reply', at: at('09:00:00') },
        { sessionId: 'b', kind: 'prompt', at: at('12:00:00') },
      ]),
    ).toBe(150);
  });
});
