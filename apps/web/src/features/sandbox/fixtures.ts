// Données d'exemple des histoires : les bacs à sable et l'abonnement d'un poste.
import type { ContainersDto, IsolationDto, QuotaDto } from '@bosco/domain';

const at = (time: string) => new Date(`2026-11-06T${time}:00`).toISOString();
const GB = 1024 ** 3;
const MB = 1024 ** 2;

export const STORY_ISOLATION: IsolationDto = {
  domains: {
    added: ['pypi.org', '*.github.com'],
    locked: ['api.anthropic.com', 'claude.ai', 'platform.claude.com', 'registry.npmjs.org', 'registry.yarnpkg.com'],
  },
  image: 'bosco-agent:1',
  limits: { cpus: 2, memory: 4 * GB, processes: 512 },
  subscription: {
    account: 'camille@exemple.dev',
    available: true,
    choices: [
      { account: 'camille@exemple.dev', label: '~/.claude', path: '/home/camille/.claude' },
      { account: 'camille.perso@exemple.dev', label: '~/.claude-perso', path: '/home/camille/.claude-perso' },
    ],
    label: '~/.claude',
    profile: '/home/camille/.claude',
  },
};

export const STORY_QUOTA: QuotaDto = {
  scope: 'sandbox',
  subscriptions: [
    {
      label: '~/.claude',
      path: '/home/camille/.claude',
      fiveHour: { usage: 34, resetsAt: at('17:00') },
      sevenDay: { usage: 61, resetsAt: '2026-11-10T09:00:00.000Z' },
    },
    { label: '~/.claude-perso', path: '/home/camille/.claude-perso', fiveHour: null, sevenDay: null },
  ],
  thresholds: { fiveHour: { wait: 50, stop: 80 }, sevenDay: { wait: 70, stop: 90 } },
};

export const STORY_CONTAINERS: ContainersDto = {
  hostCpus: 16,
  measuredAt: at('15:14'),
  piloted: [
    {
      sessionId: 'c7e04a19',
      title: 'Tarifs : test en échec sur develop',
      since: at('15:08'),
      cpu: 0.3,
      cpuLimit: null,
      memory: 410 * MB,
      memoryLimit: null,
    },
  ],
  sandboxes: [
    {
      name: 'bosco-s-7ad7871f65c1-agent',
      sessionId: '7ad7871f-65c1',
      title: 'Monte TypeScript en version 6',
      cpu: 1.7,
      cpuLimit: 2,
      memory: 3.6 * GB,
      memoryLimit: 4 * GB,
    },
    {
      name: 'bosco-s-2b9e04c1aa30-agent',
      sessionId: '2b9e04c1-aa30',
      title: 'Ajoute le bloc des tarifs sous chaque club',
      cpu: 0.4,
      cpuLimit: 2,
      memory: 1.1 * GB,
      memoryLimit: 4 * GB,
    },
  ],
  totals: { cpu: 2.4, memory: 5.1 * GB, piloted: 1, sandboxes: 2 },
  unreachableSince: null,
};

export const STORY_DOCKER_DOWN: ContainersDto = {
  ...STORY_CONTAINERS,
  unreachableSince: at('15:13'),
};
