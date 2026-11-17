// Sessions du fil rouge des specs, pour les histoires : les dates suivent l'heure courante.
import type {
  ConversationStepDto,
  JournalEntryDto,
  SessionConversationDto,
  SessionDto,
  SourceDto,
} from '@bosco/domain';

const ago = (seconds: number) => new Date(Date.now() - seconds * 1000).toISOString();
const laboIa = (folder: string) => ({ folder, hidden: false, name: 'labo-ia', root: '/home/dev/www/labo-ia' });

function session(overrides: Partial<SessionDto> & Pick<SessionDto, 'id' | 'title'>): SessionDto {
  return {
    branch: 'develop',
    cost: { unpriced: false, usd: 0 },
    lastAction: null,
    lastEventAt: ago(12),
    lastMessage: null,
    model: 'claude-sonnet-5-5',
    channel: false,
    openInTerminal: false,
    pilot: null,
    recentActions: [],
    repoPath: null,
    repository: null,
    sourceId: 'pro',
    startedAt: ago(38 * 60),
    state: 'running',
    usage: { cacheCreation: 0, cacheRead: 0, input: 0, output: 0 },
    task: null,
    waiting: null,
    turns: 0,
    changedFiles: [],
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
    repository: { folder: '', hidden: false, name: 'outils-node', root: '/home/dev/www/outils-node' },
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
    repository: { folder: '', hidden: false, name: 'outils-node', root: '/home/dev/www/outils-node' },
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

const at = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60_000).toISOString();

/** Fil de la session S3 du fil rouge (E2a). */
export const STORY_JOURNAL: JournalEntryDto[] = [
  {
    seq: 1,
    at: at(38),
    kind: 'prompt',
    text: 'Les PDF avec des tableaux sont coupés au mauvais endroit, regarde le découpage.',
  },
  { seq: 2, at: at(37), kind: 'reply', text: 'Je relis le découpage des PDF, puis j’écris un test avec un tableau.' },
  { seq: 3, at: at(36), kind: 'tool', text: 'Read · src/indexer/pdf.ts' },
  {
    seq: 4,
    at: at(22),
    kind: 'reply',
    text: 'Le découpage coupe au milieu des tableaux. Je regroupe les lignes d’un même tableau dans un seul bloc.',
  },
  { seq: 5, at: at(21), kind: 'tool', text: 'Edit · src/indexer/pdf.ts' },
  { seq: 6, at: at(12), kind: 'tool', text: 'Edit · src/indexer/pdf.test.ts' },
  {
    seq: 7,
    at: at(3),
    kind: 'reply',
    text: 'Le test du tableau est écrit. Je lance toute la suite pour vérifier que rien d’autre ne bouge.',
  },
  { seq: 8, at: at(0.2), kind: 'tool', text: 'Bash · yarn test --forceExit' },
];

/** La session S3 en cours, avec ses fichiers modifiés et ses tours. */
export const STORY_RUNNING: SessionDto = {
  ...(STORY_SESSIONS[1] as SessionDto),
  turns: 23,
  model: 'claude-sonnet-5-5',
  changedFiles: [
    { path: 'src/indexer/pdf.ts', added: 24, removed: 6 },
    { path: 'src/indexer/pdf.test.ts', added: 41, removed: 0 },
  ],
};

type ToolStepDto = Extract<ConversationStepDto, { kind: 'tool' }>;

function toolStep(
  id: string,
  name: string,
  input: Record<string, unknown>,
  start: number,
  end: null | number,
  output: null | string,
  error = false,
): ToolStepDto {
  return {
    at: at(start),
    endedAt: end === null ? null : at(end),
    error,
    id,
    input,
    kind: 'tool',
    name,
    output,
    summary: name,
  };
}

const PDF_TS = `export function chunkPdf(pages: Page[]): Chunk[] {
  const chunks: Chunk[] = [];
  for (const page of pages) chunks.push(...splitBlocks(page.blocks));
  return chunks;
}`;

/** Étapes du fil rouge, une par pattern d'AI Elements : outil, terminal, tests, pile d'appels, diff, plan, sous-agent. */
export const STORY_STEPS = {
  read: toolStep(
    't1',
    'Read',
    { file_path: '/home/dev/www/labo-ia/packages/rag/src/indexer/pdf.ts' },
    36,
    35.99,
    PDF_TS,
  ),
  grep: toolStep('t2', 'Grep', { pattern: 'splitBlocks' }, 35, 34.995, 'src/indexer/pdf.ts\nsrc/indexer/blocks.ts'),
  edit: toolStep(
    't3',
    'Edit',
    {
      file_path: '/home/dev/www/labo-ia/packages/rag/src/indexer/pdf.ts',
      old_string: '  for (const page of pages) chunks.push(...splitBlocks(page.blocks));',
      new_string:
        '  for (const page of pages) {\n    // Les lignes d’un même tableau restent dans un seul bloc\n    chunks.push(...splitBlocks(groupTables(page.blocks)));\n  }',
    },
    21,
    20.99,
    'The file has been updated.',
  ),
  terminal: toolStep(
    't4',
    'Bash',
    { command: 'yarn lint', description: 'Vérifie le lint du paquet rag' },
    16,
    15.95,
    'yarn run v1.22.22\n$ eslint src\nDone in 2.84s.',
  ),
  tests: toolStep(
    't5',
    'Bash',
    { command: 'yarn test --forceExit', description: 'Lance toute la suite de tests' },
    12,
    11.6,
    ' ✓ src/indexer/blocks.test.ts (6 tests) 41ms\n ✓ keeps a table in one chunk 12ms\n × splits a long table across pages 8ms\n ↓ indexes scanned PDF [skipped]\n\n Tests  1 failed | 2 passed | 1 skipped (4)',
    true,
  ),
  stack: toolStep(
    't6',
    'Bash',
    { command: 'node scripts/reindex.mjs', description: 'Réindexe les PDF de démonstration' },
    3,
    2.98,
    "TypeError: Cannot read properties of undefined (reading 'rows')\n    at groupTables (src/indexer/pdf.ts:14:31)\n    at chunkPdf (src/indexer/pdf.ts:4:47)\n    at parse (node_modules/pdfjs-dist/build/pdf.js:1022:12)\n    at process (node_modules/pdfjs-dist/build/pdf.js:988:5)",
    true,
  ),
  plan: toolStep(
    't7',
    'TodoWrite',
    {
      todos: [
        { content: 'Relire le découpage des PDF', status: 'completed' },
        { content: 'Regrouper les lignes d’un tableau', status: 'completed' },
        { content: 'Corriger le tableau sur deux pages', status: 'in_progress' },
        { content: 'Relancer toute la suite', status: 'pending' },
      ],
    },
    1.5,
    1.49,
    'Todos have been modified successfully.',
  ),
  subagent: {
    ...toolStep(
      't8',
      'Agent',
      {
        description: 'Chercher les PDF de test',
        prompt: 'Trouve les PDF de démonstration qui contiennent un tableau.',
      },
      30,
      29.99,
      'Async agent launched successfully.',
    ),
    subagent: {
      agentType: 'Explore',
      description: 'Chercher les PDF de test',
      endedAt: at(29.2),
      finished: true,
      model: 'claude-sonnet-5-5',
      parts: [
        toolStep(
          's1',
          'Glob',
          { pattern: 'fixtures/**/*.pdf' },
          29.9,
          29.89,
          'fixtures/devis.pdf\nfixtures/facture.pdf',
        ),
        toolStep(
          's2',
          'Bash',
          { command: 'pdftotext fixtures/devis.pdf - | grep -c Total', description: 'Compte les tableaux du devis' },
          29.7,
          29.69,
          '2',
        ),
        {
          at: at(29.2),
          kind: 'text' as const,
          text: 'Deux fichiers contiennent un tableau : `fixtures/devis.pdf` et `fixtures/facture.pdf`.',
        },
      ],
      partial: false,
      prompt: 'Trouve les PDF de démonstration qui contiennent un tableau.',
      result: 'Deux fichiers contiennent un tableau : `fixtures/devis.pdf` et `fixtures/facture.pdf`.',
      startedAt: at(29.95),
    },
  },
  search: toolStep(
    't11',
    'WebSearch',
    { query: 'pdf.js extract table rows' },
    34,
    33.99,
    'Web search results for query: "pdf.js extract table rows"\n\nLinks: [{"title":"PDF.js","url":"https://mozilla.github.io/pdf.js/"},{"title":"Extracting tables from PDFs","url":"https://github.com/mozilla/pdf.js/discussions/17000"},{"title":"pdfplumber tables","url":"https://pypi.org/project/pdfplumber/"}]',
  ),
  fetch: toolStep(
    't12',
    'WebFetch',
    { url: 'https://mozilla.github.io/pdf.js/', prompt: 'Comment lire un tableau ?' },
    33.5,
    33.49,
    'PDF.js lit le texte et ses positions.',
  ),
  mcp: toolStep(
    't9',
    'mcp__github__get_issue',
    { owner: 'labo-ia', repo: 'rag', issue_number: 42 },
    33,
    32.99,
    '{ "title": "Tableaux coupés dans les PDF" }',
  ),
  running: toolStep('t10', 'Bash', { command: 'yarn test --forceExit' }, 0.2, null, null),
};

/** Fil complet du fil rouge : ta demande, puis les réflexions, outils et réponses de l'agent. */
export const STORY_CONVERSATION: SessionConversationDto = {
  partial: false,
  turns: [
    {
      at: at(38),
      id: 'u1',
      role: 'user',
      parts: [
        {
          at: at(38),
          kind: 'text',
          text: 'Les PDF avec des tableaux sont coupés au mauvais endroit, regarde le découpage.',
        },
      ],
    },
    {
      at: at(37),
      id: 'a1',
      role: 'assistant',
      parts: [
        {
          at: at(37),
          kind: 'reasoning',
          seconds: 4,
          text: 'Le découpage travaille **bloc par bloc** : un tableau sur plusieurs blocs est coupé entre eux.',
        },
        { at: at(37), kind: 'text', text: 'Je relis le découpage des PDF, puis j’écris un test avec un tableau.' },
        STORY_STEPS.read,
        STORY_STEPS.grep,
        STORY_STEPS.search,
        STORY_STEPS.fetch,
        STORY_STEPS.mcp,
        STORY_STEPS.subagent,
        {
          at: at(22),
          kind: 'text',
          text: 'Le découpage coupe au milieu des tableaux. Je regroupe les lignes d’un même tableau :\n\n```ts\nchunks.push(...splitBlocks(groupTables(page.blocks)));\n```\n\n| Fichier | Tableaux |\n| --- | --- |\n| `devis.pdf` | 2 |\n| `facture.pdf` | 1 |',
        },
        STORY_STEPS.edit,
        { at: at(17), kind: 'reasoning', seconds: 2, text: '' },
        STORY_STEPS.terminal,
        STORY_STEPS.tests,
        STORY_STEPS.stack,
        STORY_STEPS.plan,
        {
          at: at(1),
          kind: 'text',
          text: 'Le test du tableau sur deux pages échoue encore : `groupTables` ne gère pas une page **sans tableau**. Je corrige, puis je relance toute la suite.',
        },
        STORY_STEPS.running,
      ],
    },
  ],
};
