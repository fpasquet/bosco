import { describe, expect, it } from 'vitest';
// Ce que les scénarios ne voient pas : la reprise selon le profil, la part du cache et la fin de la durée.
import type { SessionDto, SourceDto } from '@bosco/domain';
import { cacheShare, durationEnd, resumeCommand } from './detail';

const sources: SourceDto[] = [
  { id: 'pro', label: 'pro', liveTracking: true, path: '/home/dev/.claude', watched: true },
  { id: 'perso', label: 'perso', liveTracking: true, path: '/home/dev/.claude-perso', watched: true },
];

const session = (overrides: Partial<SessionDto>) =>
  ({
    id: 'c41e9a07-1111',
    sourceId: 'pro',
    state: 'ended',
    lastEventAt: '2026-11-06T14:10:00.000Z',
    usage: { input: 10, output: 5, cacheCreation: 26, cacheRead: 64 },
    ...overrides,
  }) as SessionDto;

describe('resumeCommand', () => {
  it('resumes a closed session, with the configuration folder of another profile', () => {
    expect(resumeCommand(session({}), sources, '/home/dev')).toBe('claude --resume c41e9a07-1111');
    expect(resumeCommand(session({ sourceId: 'perso' }), sources, '/home/dev')).toBe(
      'CLAUDE_CONFIG_DIR=~/.claude-perso claude --resume c41e9a07-1111',
    );
  });

  it('gives nothing for a session still open (RF-SESS-09)', () => {
    expect(resumeCommand(session({ state: 'running' }), sources, '/home/dev')).toBeNull();
    expect(resumeCommand(session({ state: 'inactive' }), sources, '/home/dev')).toBeNull();
  });
});

describe('cacheShare and durationEnd', () => {
  it('counts the cache read on what the model read, and stops the duration at the last event once closed', () => {
    const now = new Date('2026-11-06T15:00:00.000Z');
    expect(cacheShare(session({}).usage)).toBe(64);
    expect(durationEnd(session({}), now).toISOString()).toBe('2026-11-06T14:10:00.000Z');
    expect(durationEnd(session({ state: 'running' }), now)).toBe(now);
  });
});
