// Règles d'état d'une session qu'aucun scénario ne voit seules : durée d'attente exacte.
import { describe, expect, it } from 'vitest';
import { Session } from './session.ts';

describe('Session', () => {
  it('measures the waiting time from the request', () => {
    const session = Session.discover('c41e9a07');
    session.askPermission(new Date('2026-11-07T14:00:00Z'));
    expect(session.waitedFor(new Date('2026-11-07T14:00:40Z'))).toBe(40_000);
  });

  it('refuses a second pending permission', () => {
    const session = Session.discover('c41e9a07');
    session.askPermission(new Date());
    expect(() => session.askPermission(new Date())).toThrow(
      expect.objectContaining({ code: 'permissionAlreadyPending' }),
    );
  });
});
