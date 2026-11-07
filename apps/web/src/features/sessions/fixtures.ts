// Sessions du fil rouge des specs, pour les histoires : les dates suivent l'heure courante.
import type { SessionDto, SourceDto } from '@bosco/domain';

const ago = (seconds: number) => new Date(Date.now() - seconds * 1000).toISOString();
const laboIa = (folder: string) => ({ folder, name: 'labo-ia', root: '/home/dev/www/labo-ia' });

function session(overrides: Partial<SessionDto> & Pick<SessionDto, 'id' | 'title'>): SessionDto {
  return {
    branch: 'develop',
    cost: { unpriced: false, usd: 0 },
    lastAction: null,
    lastEventAt: ago(12),
    lastMessage: null,
    model: 'claude-sonnet-5-5',
    recentActions: [],
    repoPath: null,
    repository: null,
    sourceId: 'pro',
    startedAt: ago(38 * 60),
    state: 'running',
    usage: { cacheCreation: 0, cacheRead: 0, input: 0, output: 0 },
    waiting: null,
    ...overrides,
  };
}

export const STORY_SOURCES: SourceDto[] = [
  { id: 'pro', label: 'pro', liveTracking: false, path: '/home/dev/.claude', watched: true },
  { id: 'perso', label: 'perso', liveTracking: false, path: '/home/dev/.claude-perso', watched: true },
];

export const STORY_SESSIONS: SessionDto[] = [
  session({
    id: 'c41e9a07',
    title: 'Specs du tableau de bord Bosco',
    sourceId: 'perso',
    branch: 'feat/specs',
    repository: laboIa('packages/bosco'),
    model: 'claude-opus-5-5',
    lastAction: 'Bash · npm run db:migrate',
    recentActions: ['Bash · npm run db:migrate', 'Modifie src/migrations/0003.ts', 'Lit src/db/schema.ts'],
    lastEventAt: ago(40),
    startedAt: ago(72 * 60),
    cost: { unpriced: false, usd: 1.84 },
    usage: { cacheCreation: 12_000, cacheRead: 150_000, input: 40_000, output: 10_000 },
  }),
  session({
    id: '5e0a91c3',
    title: 'Corriger l’indexation des PDF dans Elasticsearch',
    repository: laboIa('packages/rag'),
    lastAction: 'Bash · yarn test --forceExit',
    recentActions: ['Bash · yarn test --forceExit', 'Modifie src/indexer/pdf.ts'],
    cost: { unpriced: false, usd: 0.62 },
    usage: { cacheCreation: 4000, cacheRead: 60_000, input: 25_000, output: 5000 },
  }),
  session({
    id: '9b72d4e1',
    title: 'Migrer le logger vers OpenTelemetry',
    branch: 'feat/logger-otel',
    repository: { folder: '', name: 'outils-node', root: '/home/dev/www/outils-node' },
    lastAction: 'Modifie src/logger/index.ts',
    recentActions: ['Modifie src/logger/index.ts', 'Lit src/logger/transports.ts', 'Bash · npm run typecheck'],
    lastEventAt: ago(3),
    startedAt: ago(52 * 60),
    cost: { unpriced: false, usd: 1.12 },
    usage: { cacheCreation: 20_000, cacheRead: 400_000, input: 56_000, output: 10_000 },
  }),
  session({
    id: '3d18f0aa',
    title: 'Mettre à jour les dépendances',
    branch: 'main',
    repository: { folder: '', name: 'outils-node', root: '/home/dev/www/outils-node' },
    state: 'inactive',
    lastAction: 'Bash · npm outdated',
    lastEventAt: ago(47 * 60),
    startedAt: ago(70 * 60),
    cost: { unpriced: false, usd: 0.09 },
    usage: { cacheCreation: 0, cacheRead: 10_000, input: 7000, output: 1000 },
  }),
];

/** Les deux sessions du fil rouge qui t'attendent : une autorisation demandée, un tour terminé. */
export const STORY_WAITING: SessionDto[] = [
  session({
    id: '7a3e5f21',
    title: 'Digest quotidien de la veille média',
    branch: 'feat/digest',
    repository: laboIa('packages/veille-presse'),
    state: 'waiting',
    lastEventAt: ago(6 * 60),
    waiting: { kind: 'turn', message: 'Le digest est généré. Veux-tu que je lance les tests ?', since: ago(6 * 60) },
    cost: { unpriced: false, usd: 0.38 },
  }),
  session({
    id: 'c41e9a07',
    title: 'Specs du tableau de bord Bosco',
    sourceId: 'perso',
    branch: 'feat/specs',
    repository: laboIa('packages/bosco'),
    state: 'waiting',
    lastEventAt: ago(40),
    waiting: { kind: 'permission', requestId: 'req-1', tool: 'Bash', detail: 'npm run db:migrate', since: ago(40) },
    cost: { unpriced: false, usd: 1.84 },
  }),
];
