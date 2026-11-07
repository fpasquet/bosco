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
