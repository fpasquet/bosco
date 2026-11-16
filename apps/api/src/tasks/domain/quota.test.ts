// Ce que les scénarios ne voient pas : les seuils exacts, la remise à zéro d'une fenêtre et la lecture du flux.
import { describe, expect, it } from 'vitest';
import { quotaWindowsOf } from '../../shared/domain/subscription-quota.ts';
import {
  checkQuotaThresholds,
  DEFAULT_QUOTA_THRESHOLDS,
  InvalidQuota,
  quotaStop,
  quotaWait,
  usageOf,
} from './quota.ts';

const now = new Date('2026-11-16T14:00:00Z');
const later = new Date('2026-11-16T15:00:00Z');
const nextWeek = new Date('2026-11-23T09:00:00Z');

describe('subscription quota', () => {
  it('reads the windows of a rate limit event from the stream', () => {
    const windows = quotaWindowsOf({
      type: 'rate_limit_event',
      rate_limit_info: {
        status: 'allowed',
        unifiedWindows: {
          five_hour: { utilization: 0.36, resetsAt: later.getTime() / 1000 },
          seven_day: { utilization: 0.14, resetsAt: nextWeek.getTime() / 1000 },
        },
      },
    });
    expect(windows).toEqual({
      fiveHour: { utilization: 0.36, resetsAt: later },
      sevenDay: { utilization: 0.14, resetsAt: nextWeek },
    });
    expect(quotaWindowsOf({ type: 'assistant' })).toBeNull();
  });

  it('CA-CONT-98 · counts a window from zero once its reset time has passed', () => {
    const windows = { fiveHour: { utilization: 0.9, resetsAt: later } };
    expect(usageOf(windows, 'fiveHour', now)).toBe(90);
    expect(usageOf(windows, 'fiveHour', later)).toBe(0);
    expect(usageOf(windows, 'sevenDay', now)).toBeNull();
  });

  it('CA-TACH-99 · holds a task from the wait threshold of either window', () => {
    expect(quotaWait({ fiveHour: { utilization: 0.49, resetsAt: later } }, DEFAULT_QUOTA_THRESHOLDS, now)).toBeNull();
    expect(quotaWait({ fiveHour: { utilization: 0.52, resetsAt: later } }, DEFAULT_QUOTA_THRESHOLDS, now)).toMatch(
      /^Quota de l’abonnement : 5 h à 52 %, reprise vers /,
    );
    expect(quotaWait({ sevenDay: { utilization: 0.7, resetsAt: nextWeek } }, DEFAULT_QUOTA_THRESHOLDS, now)).toMatch(
      /^Quota de l’abonnement : semaine à 70 %, reprise /,
    );
    expect(quotaWait({}, DEFAULT_QUOTA_THRESHOLDS, now)).toBeNull();
  });

  it('CA-TACH-100 · stops an agent from the stop threshold', () => {
    expect(quotaStop({ fiveHour: { utilization: 0.79, resetsAt: later } }, DEFAULT_QUOTA_THRESHOLDS, now)).toBeNull();
    expect(quotaStop({ fiveHour: { utilization: 0.81, resetsAt: later } }, DEFAULT_QUOTA_THRESHOLDS, now)).toBe(
      'Quota de l’abonnement atteint : fenêtre de 5 h à 81 %',
    );
  });

  it('CA-CONT-99 · keeps each wait threshold under its stop threshold, from 1 to 100 %', () => {
    expect(checkQuotaThresholds(DEFAULT_QUOTA_THRESHOLDS)).toEqual(DEFAULT_QUOTA_THRESHOLDS);
    expect(() => checkQuotaThresholds({ ...DEFAULT_QUOTA_THRESHOLDS, fiveHour: { wait: 80, stop: 80 } })).toThrow(
      InvalidQuota,
    );
    expect(() => checkQuotaThresholds({ ...DEFAULT_QUOTA_THRESHOLDS, sevenDay: { wait: 0, stop: 90 } })).toThrow(
      InvalidQuota,
    );
  });
});
