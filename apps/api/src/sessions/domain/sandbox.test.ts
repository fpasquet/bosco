// Ce que les scénarios ne voient pas : le temps exact de l'arrêt, de la notification et de la suppression d'un bac à
// sable, et les noms de branche refusés.
import { describe, expect, it } from 'vitest';
import { checkSandboxBranch, housekeepingOf, sandboxBranchOf, SandboxError, type SandboxInfo } from './sandbox.ts';

const at = new Date('2026-11-06T14:31:00Z');
const minutes = (count: number) => new Date(at.getTime() + count * 60 * 1000);
const sandbox: SandboxInfo = {
  base: 'abc123',
  branch: 'bosco/s-typescript-6',
  from: 'develop',
  lastMessageAt: at,
  profile: '/home/dev/.claude-perso',
  removedAt: null,
  retrievedAt: null,
  warnedAt: null,
};

describe('sandbox', () => {
  it('names the branch after the first message', () => {
    expect(sandboxBranchOf('Monte TypeScript en version 6 et corrige les erreurs')).toBe(
      'bosco/s-monte-typescript-en-version-6-et-corrige',
    );
  });

  it('refuses a branch outside the prefix or that git would refuse', () => {
    expect(checkSandboxBranch(' bosco/s-typescript-6 ')).toBe('bosco/s-typescript-6');
    expect(() => checkSandboxBranch('main')).toThrow(SandboxError);
    expect(() => checkSandboxBranch('bosco/s-a..b')).toThrow(SandboxError);
    expect(() => checkSandboxBranch('bosco/s-a b')).toThrow(SandboxError);
  });

  it('CA-SESS-110 · stops a running container after 30 minutes without a message, never during a turn', () => {
    expect(housekeepingOf(sandbox, minutes(29), { running: true, turn: false })).toBeNull();
    expect(housekeepingOf(sandbox, minutes(30), { running: true, turn: false })).toBe('stop');
    expect(housekeepingOf(sandbox, minutes(30), { running: false, turn: false })).toBeNull();
    expect(housekeepingOf(sandbox, minutes(90), { running: true, turn: true })).toBeNull();
  });

  it('CA-SESS-115 · warns the day before, then removes after 7 days without a message', () => {
    const days = (count: number) => new Date(at.getTime() + count * 24 * 60 * 60 * 1000);
    expect(housekeepingOf(sandbox, days(6), { running: false, turn: false })).toBe('warn');
    expect(housekeepingOf({ ...sandbox, warnedAt: days(6) }, days(6.5), { running: false, turn: false })).toBeNull();
    expect(housekeepingOf({ ...sandbox, warnedAt: days(6) }, days(7), { running: false, turn: false })).toBe('remove');
    expect(housekeepingOf({ ...sandbox, removedAt: days(7) }, days(8), { running: false, turn: false })).toBeNull();
  });
});
