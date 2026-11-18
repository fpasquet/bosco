// Ce que les scénarios ne voient pas : un abonnement jamais lu, avant le premier tour qui dit son usage.
import { describe, expect, it } from 'vitest';
import type { QuotaWindows } from '../../shared/domain/subscription-quota.ts';
import { QuotaService, type QuotaStore } from './quota.service.ts';

const now = new Date('2026-11-16T14:00:00Z');
const later = new Date('2026-11-16T15:00:00Z');
const PRO = '/home/dev/.claude';

function memoryStore(): QuotaStore {
  let windows: Record<string, QuotaWindows> = {};
  return {
    saveScope: () => Promise.resolve(),
    saveThresholds: () => Promise.resolve(),
    saveWindows: (next) => {
      windows = next;
      return Promise.resolve();
    },
    scope: () => Promise.resolve(null),
    thresholds: () => Promise.resolve(null),
    windows: () => Promise.resolve(windows),
  };
}

describe('QuotaService', () => {
  it('CA-REGL-13 · leaves a subscription never read free, until a piloted turn says its usage', async () => {
    const quota = new QuotaService(memoryStore(), { now: () => now });
    await quota.load();
    expect(quota.usage(PRO)).toEqual({ fiveHour: null, sevenDay: null });
    expect([quota.holdReason(PRO, true), quota.stopReason(PRO, true)]).toEqual([null, null]);
    await quota.record(PRO, { fiveHour: { utilization: 0.85, resetsAt: later } });
    expect(quota.holdReason(PRO, true)).toMatch(/^Quota de l’abonnement : 5 h à 85 %/);
    expect(quota.stopReason(PRO, true)).toBe('Quota de l’abonnement atteint : fenêtre de 5 h à 85 %');
  });
});
