import { describe, expect, it } from 'vitest';
// Ce que les scénarios ne voient pas : chaque cas de tri, de regroupement et de filtre de la vue d'ensemble.
import type { SessionDto, SourceDto } from '@bosco/domain';
import {
  filterSessions,
  groupByRepository,
  groupByState,
  indicatorsOf,
  openSessions,
  profileMark,
  repositoriesOf,
  sortSessions,
} from './overview';

const now = new Date('2026-11-06T15:00:00');

function session(id: string, overrides: Partial<SessionDto> = {}): SessionDto {
  return {
    id,
    branch: 'develop',
    cost: { unpriced: false, usd: 0.5 },
    lastAction: null,
    lastEventAt: new Date('2026-11-06T14:59:00').toISOString(),
    lastMessage: null,
    model: 'claude-sonnet-5-5',
    recentActions: [],
    repoPath: '/home/dev/www/labo-ia/packages/rag',
    repository: { folder: 'packages/rag', name: 'labo-ia', root: '/home/dev/www/labo-ia' },
    sourceId: 'pro',
    startedAt: new Date('2026-11-06T14:00:00').toISOString(),
    state: 'running',
    title: `Session ${id}`,
    usage: { cacheCreation: 0, cacheRead: 0, input: 0, output: 0 },
    waiting: null,
    ...overrides,
  };
}

const at = (time: string) => new Date(`2026-11-06T${time}`).toISOString();
const outilsNode = { folder: '', name: 'outils-node', root: '/home/dev/www/outils-node' };

describe('openSessions', () => {
  it('keeps running sessions and sessions active today, and leaves older ones to the history', () => {
    const yesterday = session('old', { state: 'inactive', lastEventAt: new Date('2026-11-05T18:00:00').toISOString() });
    const today = session('today', { state: 'inactive', lastEventAt: at('09:00:00') });
    expect(openSessions([yesterday, today, session('live')], now).map(({ id }) => id)).toEqual(['today', 'live']);
  });
});

describe('openSessions once Claude Code tells which sessions are open', () => {
  it('leaves the ended sessions to the history, even active a moment ago', () => {
    expect(openSessions([session('ended', { state: 'ended' }), session('live')], now).map(({ id }) => id)).toEqual([
      'live',
    ]);
  });
});

describe('sortSessions', () => {
  it('sorts by state, then by the most recent activity (CA-SESS-09)', () => {
    const sorted = sortSessions([
      session('idle', { state: 'inactive', lastEventAt: at('14:13:00') }),
      session('older', { lastEventAt: at('14:50:00') }),
      session('newer', { lastEventAt: at('14:59:48') }),
    ]);
    expect(sorted.map(({ id }) => id)).toEqual(['newer', 'older', 'idle']);
  });
});

describe('groupByRepository', () => {
  it('orders repositories by their most urgent session and puts sessions outside git last', () => {
    const groups = groupByRepository([
      session('loose', { repository: null }),
      session('idle', { repository: outilsNode, state: 'inactive' }),
      session('rag'),
    ]);
    expect(groups.map(({ name, sessions }) => [name, sessions.length])).toEqual([
      ['labo-ia', 1],
      ['outils-node', 1],
      [null, 1],
    ]);
  });
});

describe('groupByState', () => {
  it('gives one column per state, even an empty one', () => {
    expect(groupByState([session('a'), session('b')]).map(({ sessions, state }) => [state, sessions.length])).toEqual([
      ['waiting', 0],
      ['running', 2],
      ['inactive', 0],
    ]);
  });
});

describe('filterSessions', () => {
  const sessions = [
    session('rag', { title: 'Corriger l’indexation des PDF' }),
    session('logger', { repository: outilsNode, branch: 'feat/logger-otel' }),
    session('idle', { repository: outilsNode, state: 'inactive' }),
  ];
  const all = { hideInactive: false, query: '', repository: null };

  it('keeps the chosen repository (CA-SESS-11)', () => {
    expect(filterSessions(sessions, { ...all, repository: 'outils-node' }).map(({ id }) => id)).toEqual([
      'logger',
      'idle',
    ]);
  });

  it('searches titles, branches and folders without case, and hides inactive sessions on demand', () => {
    expect(filterSessions(sessions, { ...all, query: 'PDF' }).map(({ id }) => id)).toEqual(['rag']);
    expect(filterSessions(sessions, { ...all, query: 'otel' }).map(({ id }) => id)).toEqual(['logger']);
    expect(filterSessions(sessions, { ...all, hideInactive: true }).map(({ id }) => id)).toEqual(['rag', 'logger']);
  });
});

describe('indicatorsOf', () => {
  it('adds the cost of every session started today, closed ones included (CA-SESS-10)', () => {
    const closed = session('closed', {
      state: 'inactive',
      lastEventAt: at('10:00:00'),
      cost: { unpriced: false, usd: 0.74 },
    });
    const yesterday = session('yesterday', { startedAt: new Date('2026-11-05T22:00:00').toISOString() });
    const open = [session('rag', { cost: { unpriced: false, usd: 0.62 } }), yesterday];
    const indicators = indicatorsOf(open, [...open, closed], now);
    expect([indicators.sessionsToday, indicators.endedToday]).toEqual([2, 0]);
    expect(indicators.costToday.usd).toBeCloseTo(1.36);
    expect(indicators.running).toBe(2);
  });

  it('dates the inactivity from the most recent inactive session', () => {
    const indicators = indicatorsOf(
      [
        session('a', { state: 'inactive', lastEventAt: at('14:13:00') }),
        session('b', { state: 'inactive', lastEventAt: at('13:00:00') }),
      ],
      [],
      now,
    );
    expect([indicators.inactive, indicators.inactiveSince?.toISOString()]).toEqual([2, at('14:13:00')]);
  });
});

describe('repositoriesOf', () => {
  it('lists the repositories with their open sessions, in the order of the table', () => {
    expect(
      repositoriesOf([
        session('idle', { repository: outilsNode, state: 'inactive' }),
        session('rag'),
        session('bosco'),
      ]),
    ).toEqual([
      { name: 'labo-ia', count: 2 },
      { name: 'outils-node', count: 1 },
    ]);
  });
});

describe('profileMark', () => {
  const sources: SourceDto[] = [
    { id: 'pro', label: 'pro', liveTracking: false, path: '/home/dev/.claude', watched: true },
    { id: 'perso', label: 'perso', liveTracking: false, path: '/home/dev/.claude-perso', watched: true },
  ];

  it('marks only the sessions of another profile than the default one', () => {
    expect(profileMark(session('rag'), sources)).toBeNull();
    expect(profileMark(session('bosco', { sourceId: 'perso' }), sources)).toBe('perso');
  });
});
