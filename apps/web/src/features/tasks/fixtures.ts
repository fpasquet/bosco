// Tâches du fil rouge des specs (lot 2), pour les histoires.
import type { IsolationDto, TaskDto, TestEnvironmentDto } from '@bosco/domain';

const at = (time: string) => new Date(`2026-11-06T${time}:00`).toISOString();

function task(overrides: Partial<TaskDto> & Pick<TaskDto, 'id' | 'instruction' | 'state' | 'title'>): TaskDto {
  return {
    context: null,
    createdAt: at('14:00'),
    createdBy: 'person',
    editable: ['blocked', 'queued', 'awaiting_session'].includes(overrides.state),
    failure: null,
    folder: '',
    guardrails: { budgetUsd: 2, maxTurns: 30, model: null, tools: null },
    log: [{ at: at('14:00'), event: 'Créée', detail: null }],
    mode: 'worker',
    outcome: { branch: null, changes: null, report: null, sessionId: null, turns: 0 },
    prerequisites: [],
    repository: { name: 'api-voix', root: '/home/dev/api-voix' },
    spentUsd: 0,
    startFrom: null,
    updatedAt: at('14:00'),
    waitingFor: [],
    ...overrides,
  };
}

export const STORY_TASKS: TaskDto[] = [
  task({
    id: 12,
    title: 'Ajouter la prononciation de « SNCF » au lexique',
    instruction: 'Ajouter la prononciation de « SNCF » au lexique.',
    state: 'to_review',
    spentUsd: 0.41,
  }),
  task({
    id: 14,
    title: 'Ajouter les tests de bout en bout du digest',
    instruction: 'Ajouter les tests de bout en bout du digest.',
    state: 'awaiting_session',
    mode: 'session',
    repository: { name: 'labo-ia', root: '/home/dev/labo-ia' },
    folder: 'packages/veille-presse',
  }),
  task({
    id: 13,
    title: 'Brancher le lexique sur la synthèse vocale',
    instruction: 'Brancher le lexique sur la synthèse vocale.',
    state: 'blocked',
    prerequisites: [12],
    startFrom: 12,
    waitingFor: [{ id: 12, state: 'to_review', title: 'Ajouter la prononciation de « SNCF » au lexique' }],
  }),
  task({
    id: 15,
    title: 'Publier le digest avec la nouvelle voix',
    instruction: 'Publier le digest avec la nouvelle voix.',
    state: 'blocked',
    prerequisites: [13, 14],
    guardrails: { budgetUsd: 1.5, maxTurns: 30, model: null, tools: null },
    repository: { name: 'labo-ia', root: '/home/dev/labo-ia' },
    folder: 'packages/veille-presse',
    waitingFor: [
      { id: 13, state: 'blocked', title: 'Brancher le lexique sur la synthèse vocale' },
      { id: 14, state: 'awaiting_session', title: 'Ajouter les tests de bout en bout du digest' },
    ],
  }),
  task({
    id: 9,
    title: 'Monter la version de Fastify',
    instruction: 'Monter la version de Fastify.',
    state: 'failed',
    failure: 'Budget atteint : 0,35 $ sur 0,35 $',
    spentUsd: 0.35,
    guardrails: { budgetUsd: 0.35, maxTurns: 30, model: null, tools: null },
  }),
];

/** Isolation du worker du fil rouge (E11a, E11b). */
export const STORY_ISOLATION: IsolationDto = {
  capacity: { maxAgents: 4, maxAgentsRange: [1, 8], reservedMemory: 4 * 1024 ** 3, freeMemory: 28 * 1024 ** 3 },
  domains: {
    locked: ['api.anthropic.com', 'claude.ai', 'platform.claude.com', 'registry.npmjs.org', 'registry.yarnpkg.com'],
    added: ['github.com', '*.github.com'],
  },
  image: 'bosco-agent:1',
  limits: { memory: 4 * 1024 ** 3, cpus: 2, processes: 512 },
  refusals: [
    { at: at('15:02'), taskId: 12, host: 'pypi.org' },
    { at: new Date('2026-11-05T11:41:00').toISOString(), taskId: 9, host: 'api.fastify.dev' },
  ],
};

/** Environnement de test d'api-voix du fil rouge (E12a). */
export const STORY_TEST_ENVIRONMENT: TestEnvironmentDto = {
  repository: 'api-voix',
  branch: 'develop',
  file: 'compose.yaml',
  mode: 'auto',
  selected: [],
  image: null,
  defaultImage: 'bosco-agent:1',
  services: [
    { name: 'app', image: null },
    { name: 'node', image: 'node:22' },
    { name: 'database', image: 'mysql:8.0' },
    { name: 'rabbitmq', image: 'rabbitmq:3.8' },
    { name: 'fake-gcs-server', image: 'fake-gcs:1.54.0' },
  ],
  launched: [
    { name: 'database', image: 'mysql:8.0' },
    { name: 'rabbitmq', image: 'rabbitmq:3.8' },
    { name: 'fake-gcs-server', image: 'fake-gcs:1.54.0' },
  ],
  excluded: [
    { name: 'app', reason: 'c’est l’application elle-même' },
    { name: 'node', reason: 'sert à lancer l’application' },
  ],
  removed: ['ports publiés', 'volumes nommés'],
  limits: { memory: 1024 ** 3, cpus: 1, waitSeconds: 180 },
  lastRun: {
    taskId: 12,
    at: at('14:47'),
    removedAt: at('14:56'),
    launches: [
      { name: 'database', image: 'mysql:8.0', readySeconds: 11, error: null },
      { name: 'rabbitmq', image: 'rabbitmq:3.8', readySeconds: 8, error: null },
      { name: 'fake-gcs-server', image: 'fake-gcs:1.54.0', readySeconds: 2, error: null },
    ],
  },
};
