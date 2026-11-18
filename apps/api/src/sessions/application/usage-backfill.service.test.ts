// Ce que les scénarios ne voient pas : une base d'avant la page Usage, dont les sessions n'ont pas l'usage de leurs
// tours ; il est relu une fois dans les transcripts, ou pris au jour du début quand le transcript a disparu.
import { describe, expect, it } from 'vitest';
import type { TranscriptEvent } from '../domain/transcript-event.ts';
import { Session } from '../domain/session.ts';
import { TokenUsage } from '../domain/token-usage.ts';
import { UsageBackfillService } from './usage-backfill.service.ts';

const START = new Date('2026-10-20T09:00:00Z');

function readBefore(id: string, sourceId: string): Session {
  const session = Session.discover(id, sourceId, START);
  session.record({
    at: START,
    branch: null,
    cwd: null,
    kind: 'reply',
    model: 'claude-sonnet-5-5',
    projectRoot: null,
    text: 'Fait.',
    usage: new TokenUsage(100, 50, 0, 900),
  });
  session.pullUsage();
  return Session.restore({ ...session.toSnapshot(), usageComplete: false });
}

const event = (at: string, overrides: Partial<TranscriptEvent>): TranscriptEvent => ({
  at: new Date(at),
  branch: null,
  cwd: null,
  kind: 'tool',
  model: 'claude-opus-5-5',
  projectRoot: null,
  text: '',
  usage: null,
  ...overrides,
});

describe('UsageBackfillService', () => {
  it('replays the turns and pull requests of each transcript, or the whole usage at the start day without one', async () => {
    const saved: { pullRequests: string[]; sessionId: string; turns: [string, number][]; complete: boolean }[] = [];
    const service = new UsageBackfillService(
      {
        listIncompleteUsage: () => Promise.resolve([readBefore('kept', 'pro'), readBefore('gone', 'pro')]),
        replaceUsage: (session) => {
          const { pullRequests, turns } = session.pullUsage();
          saved.push({
            sessionId: session.id,
            complete: session.toSnapshot().usageComplete,
            turns: turns.map(({ at, usage }) => [at.toISOString(), usage.total]),
            pullRequests: pullRequests.map(({ url }) => url),
          });
          return Promise.resolve();
        },
      },
      { list: () => Promise.resolve([{ id: 'pro', path: '/home/dev/.claude' }] as never) },
      {
        read: (_profile, sessionId) =>
          Promise.resolve(
            sessionId === 'kept'
              ? [
                  event('2026-10-20T09:00:00Z', { usage: new TokenUsage(100, 50, 0, 900) }),
                  event('2026-10-21T10:00:00Z', { usage: new TokenUsage(10, 5, 0, 0) }),
                  event('2026-10-21T10:01:00Z', {
                    kind: 'pullRequest',
                    text: 'https://github.com/clubs/creneaux/pull/4',
                  }),
                ]
              : null,
          ),
      },
    );
    const completed = await service.completeUsage();
    expect(completed).toBe(2);
    expect(saved).toEqual([
      {
        sessionId: 'kept',
        complete: true,
        turns: [
          ['2026-10-20T09:00:00.000Z', 1050],
          ['2026-10-21T10:00:00.000Z', 15],
        ],
        pullRequests: ['https://github.com/clubs/creneaux/pull/4'],
      },
      { sessionId: 'gone', complete: true, turns: [['2026-10-20T09:00:00.000Z', 1050]], pullRequests: [] },
    ]);
  });
});
