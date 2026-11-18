import type { QuotaDto, UsageDayDto, UsageReportDto } from '@bosco/domain';

// Données du fil rouge de la page Usage (E23a, E23b) : 30 derniers jours au 17 nov. 2026, pour les histoires.

/** Hauteurs de la lecture et de l'écriture du cache dans la maquette, à 0,6 M de tokens le pixel. */
const READ = [
  11, 44.5, 42.8, 18.3, 33.7, 28.6, 8.1, 5.1, 21.6, 29.2, 22.4, 29.5, 16.5, 4.8, 9.4, 28.5, 31.3, 38, 197.3, 98.7, 9.9,
  8.5, 35.7, 34.6, 45.2, 26.7, 38.8, 6.9, 8.4, 90,
];
const WRITE = [
  0.3, 1.2, 1.2, 0.5, 0.9, 0.8, 0.2, 0.1, 0.6, 0.8, 0.6, 0.8, 0.5, 0.1, 0.3, 0.8, 0.9, 1.1, 6.2, 2.7, 0.3, 0.2, 1, 1,
  1.3, 0.7, 1.1, 0.2, 0.2, 2.5,
];

function dayOf(index: number): string {
  const date = new Date(2026, 9, 19 + index, 12);
  return date.toLocaleDateString('sv');
}

function usageDay(index: number): UsageDayDto {
  const cacheRead = Math.round((READ[index] ?? 0) * 600_000);
  const cacheCreation = Math.round((WRITE[index] ?? 0) * 600_000);
  const output = Math.round(cacheRead * 0.0058);
  const input = Math.round(cacheRead * 0.00035);
  return {
    date: dayOf(index),
    tokens: { input, output, cacheRead, cacheCreation },
    cost: {
      input: input * 1.5e-6,
      output: output * 7.6e-6,
      cacheRead: cacheRead * 0.076e-6,
      cacheCreation: cacheCreation * 1.9e-6,
    },
  };
}

export const STORY_DAYS: UsageDayDto[] = READ.map((_, index) => usageDay(index));

export const STORY_USAGE: UsageReportDto = {
  from: '2026-10-19',
  since: '2026-10-08',
  models: ['claude-haiku-5-5', 'claude-opus-5-5', 'claude-sonnet-5-5'],
  activity: {
    pilotedSessions: 46,
    agentWorkSeconds: 31 * 3600 + 20 * 60,
    sandboxes: 12,
    retrievedBranches: 9,
    pullRequests: 7,
  },
  tokens: {
    input: 1_200_000,
    output: 3_400_000,
    cacheRead: 615_100_000,
    cacheCreation: 16_700_000,
    cacheReuse: 99.8,
    turnsWithoutCacheRead: 1,
    sessions: 214,
    turns: 4669,
    costUsd: 283.01,
    unpricedModels: [],
  },
  days: STORY_DAYS,
  byProject: [
    { key: 'project:2', label: 'creneaux', projectId: 2, share: 41, usd: 116.3 },
    { key: 'project:6', label: 'sejours', projectId: 6, share: 22, usd: 62.1 },
    { key: 'project:1', label: 'api-tarifs', projectId: 1, share: 18, usd: 51.05 },
    { key: 'project:3', label: 'site-clubs', projectId: 3, share: 9, usd: 25.4 },
    { key: 'outside', label: 'Hors projet', projectId: null, share: 3, usd: 8.45 },
    { key: 'others', label: '10 autres', count: 10, projectId: null, share: 7, usd: 19.71 },
  ],
  byModel: [
    { key: 'model:claude-opus-5-5', label: 'claude-opus-5-5', share: 58, usd: 164.2 },
    { key: 'model:claude-sonnet-5-5', label: 'claude-sonnet-5-5', share: 39, usd: 110.3 },
    { key: 'model:claude-haiku-5-5', label: 'claude-haiku-5-5', share: 3, usd: 8.51 },
  ],
  byProfile: [
    { key: 'profile:pro', label: 'pro', share: 71, usd: 200.94 },
    { key: 'profile:perso', label: 'perso', share: 21, usd: 59.43 },
    { key: 'profile:sandboxes', label: 'Bacs à sable', share: 8, usd: 22.64 },
  ],
};

/** Filtrée sur le groupe Club des Trois Lacs, 7 derniers jours (E23b). */
export const STORY_USAGE_GROUP: UsageReportDto = {
  ...STORY_USAGE,
  from: '2026-11-11',
  activity: {
    pilotedSessions: 9,
    agentWorkSeconds: 6 * 3600 + 10 * 60,
    sandboxes: 3,
    retrievedBranches: 2,
    pullRequests: 2,
  },
  tokens: {
    ...STORY_USAGE.tokens,
    input: 200_000,
    output: 600_000,
    cacheRead: 113_600_000,
    cacheCreation: 4_200_000,
    sessions: 41,
    turns: 902,
    costUsd: 52.8,
  },
  days: STORY_DAYS.slice(-7).map(({ tokens, ...day }) => ({
    ...day,
    tokens: {
      input: Math.round(tokens.input * 0.2),
      output: Math.round(tokens.output * 0.2),
      cacheRead: Math.round(tokens.cacheRead * 0.2),
      cacheCreation: Math.round(tokens.cacheCreation * 0.2),
    },
  })),
  byProject: [
    { key: 'project:2', label: 'creneaux', projectId: 2, share: 58, usd: 30.6 },
    { key: 'project:1', label: 'api-tarifs', projectId: 1, share: 39, usd: 20.6 },
    { key: 'project:3', label: 'site-clubs', projectId: 3, share: 12, usd: 6.3 },
  ],
};

/** Une session de modèle inconnu : comptée en tokens, sans coût. */
export const STORY_USAGE_UNPRICED: UsageReportDto = {
  ...STORY_USAGE,
  tokens: { ...STORY_USAGE.tokens, unpricedModels: ['claude-nova-1'] },
  byModel: [...STORY_USAGE.byModel, { key: 'model:claude-nova-1', label: 'claude-nova-1', share: 0, usd: null }],
};

export const STORY_USAGE_EMPTY: UsageReportDto = {
  ...STORY_USAGE,
  since: null,
  activity: { pilotedSessions: 0, agentWorkSeconds: 0, sandboxes: 0, retrievedBranches: 0, pullRequests: 0 },
  tokens: {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheCreation: 0,
    cacheReuse: 0,
    turnsWithoutCacheRead: 0,
    sessions: 0,
    turns: 0,
    costUsd: 0,
    unpricedModels: [],
  },
  days: STORY_DAYS.map((day) => ({
    ...day,
    tokens: { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 },
    cost: { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 },
  })),
  byProject: [],
  byModel: [],
  byProfile: [],
};

export const STORY_QUOTA: QuotaDto = {
  scope: 'sandbox',
  thresholds: { fiveHour: { wait: 50, stop: 80 }, sevenDay: { wait: 70, stop: 90 } },
  subscriptions: [
    {
      label: 'pro',
      path: '/home/camille/.claude',
      fiveHour: { usage: 36, resetsAt: '2026-11-17T16:00:00+01:00' },
      sevenDay: { usage: 14, resetsAt: '2026-11-24T10:00:00+01:00' },
    },
    {
      label: 'perso',
      path: '/home/camille/.claude-perso',
      fiveHour: { usage: 52, resetsAt: '2026-11-17T16:00:00+01:00' },
      sevenDay: { usage: 30, resetsAt: '2026-11-21T09:00:00+01:00' },
    },
  ],
};
