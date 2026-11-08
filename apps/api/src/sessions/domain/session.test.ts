// Ce que les scénarios ne voient pas : le délai d'inactivité à la milliseconde, le cumul de l'usage et la numérotation
// du journal d'une lecture à l'autre.
import { describe, expect, it } from 'vitest';
import type { TranscriptEvent } from './transcript-event.ts';
import { DEFAULT_INACTIVITY_DELAY_MS, Session } from './session.ts';
import { TokenUsage } from './token-usage.ts';

const at = (time: string) => new Date(`2026-11-06T${time}Z`);
const reply = (time: string, usage: TokenUsage | null = null): TranscriptEvent => ({
  at: at(time),
  kind: 'reply',
  text: 'Je relis les specs.',
  cwd: '/home/dev/labo-ia/packages/bosco',
  branch: 'feat/specs',
  model: 'claude-opus-5-5',
  repoRoot: '/home/dev/labo-ia',
  usage,
});

describe('Session', () => {
  it('stays running until the inactivity delay has fully elapsed', () => {
    const session = Session.discover('c41e9a07', 'pro', at('14:02:00'));
    session.record(reply('14:02:00'));
    const lastEvent = at('14:02:00').getTime();
    expect(session.stateAt(new Date(lastEvent + DEFAULT_INACTIVITY_DELAY_MS - 1))).toBe('running');
    expect(session.stateAt(new Date(lastEvent + DEFAULT_INACTIVITY_DELAY_MS))).toBe('inactive');
  });

  it('ends as soon as Claude Code no longer holds the session open, even right after an event', () => {
    const session = Session.discover('c41e9a07', 'pro', at('14:02:00'));
    session.record(reply('14:02:00'));
    const justAfter = new Date(at('14:02:00').getTime() + 1000);
    expect([session.stateAt(justAfter, false), session.stateAt(justAfter, true)]).toEqual(['ended', 'running']);
  });

  it('takes its first request as title until Claude Code names it, never a command', () => {
    const session = Session.discover('36cf26ee', 'pro', at('14:02:00'));
    const prompt = (time: string, text: string) => ({ ...reply(time), kind: 'prompt' as const, text });
    session.record(prompt('14:02:00', '<command-name>/clear</command-name>'));
    session.record(prompt('14:02:10', '2+2'));
    session.record(prompt('14:02:20', 'Et 3+3 ?'));
    expect(session.toSnapshot().title).toBe('2+2');
    session.record({ ...reply('14:03:00'), kind: 'title', text: 'Calculs rapides' });
    session.record(prompt('14:03:10', 'Et 4+4 ?'));
    expect(session.toSnapshot().title).toBe('Calculs rapides');
  });

  it('waits for a permission until it is settled, whoever answers first', () => {
    const session = Session.discover('c41e9a07', 'perso', at('14:02:00'));
    session.awaitPermission('req-1', 'Bash', 'npm run db:migrate', at('14:02:20'));
    const later = at('14:40:00');
    expect(session.stateAt(later)).toBe('waiting');
    expect(session.settlePermission('req-other', at('14:02:30'))).toBe(false);
    expect(session.settlePermission('req-1', at('14:02:30'))).toBe(true);
    expect(session.settlePermission('req-1', at('14:02:31'))).toBe(false);
    expect(session.stateAt(at('14:02:40'))).toBe('running');
  });

  it('waits after its turn, becomes inactive after the delay, and resumes on a newer event', () => {
    const session = Session.discover('5e0a91c3', 'pro', at('14:02:00'));
    session.endTurn('Veux-tu que je lance les tests ?', at('14:02:10'));
    const turnEnd = at('14:02:10').getTime();
    expect(session.stateAt(new Date(turnEnd + 1000))).toBe('waiting');
    expect(session.stateAt(new Date(turnEnd + DEFAULT_INACTIVITY_DELAY_MS))).toBe('inactive');
    session.record(reply('14:02:05'));
    expect(session.waiting?.kind).toBe('turn');
    session.record(reply('14:03:00'));
    expect(session.waiting).toBeNull();
  });

  it('ends when Claude Code says so, unless the registry still holds it open, and opens again on resume', () => {
    const session = Session.discover('92c46031', 'pro', at('14:02:00'));
    session.end(at('14:02:10'));
    const soon = at('14:02:20');
    expect([session.stateAt(soon), session.stateAt(soon, true)]).toEqual(['ended', 'running']);
    session.resume(at('14:05:00'));
    expect(session.stateAt(at('14:05:10'))).toBe('running');
  });

  it('counts the replies of the agent once and adds up the files it changed', () => {
    const session = Session.discover('5e0a91c3', 'pro', at('14:02:00'));
    const edit = {
      ...reply('14:03:00', new TokenUsage(1, 1, 0, 0)),
      kind: 'tool' as const,
      text: 'Edit · src/indexer/pdf.ts',
    };
    session.record({ ...edit, change: { path: 'src/indexer/pdf.ts', added: 24, removed: 6 } });
    session.record({ ...edit, usage: null, change: { path: 'src/indexer/pdf.ts', added: 1, removed: 0 } });
    const { changedFiles, turns } = session.toSnapshot();
    expect([turns, changedFiles]).toEqual([1, [{ path: 'src/indexer/pdf.ts', added: 25, removed: 6 }]]);
  });

  it('adds up the token usage, cache included', () => {
    const session = Session.discover('c41e9a07', 'pro', at('14:02:00'));
    session.record(reply('14:02:00', new TokenUsage(10, 20, 30, 40)));
    session.record(reply('14:03:00', new TokenUsage(1, 2, 3, 4)));
    expect(session.toSnapshot().usage).toEqual(new TokenUsage(11, 22, 33, 44));
  });

  it('numbers the journal without gaps across readings and keeps titles out of it', () => {
    const session = Session.discover('c41e9a07', 'pro', at('14:02:00'));
    session.record(reply('14:02:00'));
    session.record({ ...reply('14:02:30'), kind: 'title', text: 'Specs du tableau de bord Bosco' });
    expect(session.pullJournal().map((entry) => entry.seq)).toEqual([1]);
    const restored = Session.restore(session.toSnapshot());
    restored.record(reply('14:05:00'));
    expect(restored.pullJournal().map((entry) => entry.seq)).toEqual([2]);
    expect(restored.toSnapshot().title).toBe('Specs du tableau de bord Bosco');
  });
});

describe('Session cost', () => {
  it('prices each event at the model that produced it and counts unpriced tokens apart', () => {
    const session = Session.discover('c41e9a07', 'pro', at('14:02:00'));
    session.record(reply('14:02:00', new TokenUsage(1_000_000, 0, 0, 0)));
    session.record({ ...reply('14:03:00', new TokenUsage(1_000_000, 0, 0, 0)), model: 'claude-sonnet-5-5' });
    session.record({ ...reply('14:04:00', new TokenUsage(500, 0, 0, 0)), model: '<synthetic>' });
    const { costMicros, unpricedTokens } = session.toSnapshot();
    expect(costMicros).toBe(6_000_000);
    expect(unpricedTokens).toBe(500);
  });
});

describe('Session recent actions', () => {
  it('keeps the last three actions, the most recent first', () => {
    const session = Session.discover('c41e9a07', 'pro', at('14:02:00'));
    const actions: [string, string][] = [
      ['14:02:01', 'Lit a.ts'],
      ['14:02:02', 'Lit b.ts'],
      ['14:02:03', 'Modifie c.ts'],
      ['14:02:04', 'npm test'],
    ];
    for (const [time, text] of actions) session.record({ ...reply(time), kind: 'tool', text });
    expect(session.toSnapshot().recentActions).toEqual(['npm test', 'Modifie c.ts', 'Lit b.ts']);
  });
});
