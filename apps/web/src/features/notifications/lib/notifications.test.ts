import { describe, expect, it } from 'vitest';
import { STORY_NOTIFICATIONS, STORY_NOW } from '../fixtures';
import { byDay, hrefOf, kindLabel, timeOf, toHandle } from './notifications';

describe('notifications', () => {
  it('keeps to handle what waits for an answer or a review (E15a)', () => {
    expect(toHandle(STORY_NOTIFICATIONS).map(({ id }) => id)).toEqual([6, 5, 4, 1]);
  });

  it('groups by day and tells the time like the drawer', () => {
    expect(
      byDay(STORY_NOTIFICATIONS, STORY_NOW).map(({ label, notifications }) => [label, notifications.length]),
    ).toEqual([
      ['Aujourd’hui', 5],
      ['Hier', 1],
    ]);
    expect(timeOf(STORY_NOTIFICATIONS[5]?.at ?? '', STORY_NOW)).toBe('hier 11:52');
  });

  it('leads to the task or the session, and says the length of a turn', () => {
    expect([hrefOf({ sessionId: 'c41e9a07', taskId: null }), hrefOf({ sessionId: null, taskId: 12 })]).toEqual([
      '/sessions/c41e9a07',
      '/tasks/12',
    ]);
    expect(kindLabel({ kind: 'long-turn', turnMinutes: 12 })).toBe('Fin de tour · 12 min');
  });
});
