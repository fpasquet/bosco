// Sessions du fil rouge des specs, pour les histoires : les dates suivent l'heure courante.
import type {
  ConversationStepDto,
  GroupDto,
  JournalEntryDto,
  SessionConversationDto,
  SessionDto,
  SourceDto,
} from '@bosco/domain';

const ago = (seconds: number) => new Date(Date.now() - seconds * 1000).toISOString();
const maison = (folder: string) => ({ folder, id: 1, name: 'maison', root: '/home/dev/www/maison' });

function session(overrides: Partial<SessionDto> & Pick<SessionDto, 'id' | 'title'>): SessionDto {
  return {
    addedProjects: [],
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
    projectPath: null,
    project: null,
    sourceId: 'pro',
    startedAt: ago(38 * 60),
    state: 'running',
    usage: { cacheCreation: 0, cacheRead: 0, input: 0, output: 0 },
    waiting: null,
    turns: 0,
    changedFiles: [],
    ...overrides,
  };
}

export const STORY_SOURCES: SourceDto[] = [
  {
    id: 'pro',
    label: 'pro',
    liveTracking: false,
    managed: false,
    path: '/home/dev/.claude',
    unreadable: false,
    watched: true,
  },
  {
    id: 'perso',
    label: 'perso',
    liveTracking: false,
    managed: false,
    path: '/home/dev/.claude-perso',
    unreadable: false,
    watched: true,
  },
];

export const STORY_SESSIONS: SessionDto[] = [
  session({
    id: 'c41e9a07',
    title: 'Ajouter les catégories au budget du foyer',
    sourceId: 'perso',
    branch: 'feat/categories',
    project: maison('packages/budget'),
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
    title: 'Corriger la recherche des recettes par ingrédient',
    project: maison('packages/recettes'),
    addedProjects: [{ id: 2, name: 'outils-node', root: '/home/dev/www/outils-node' }],
    lastAction: 'Bash · yarn test --forceExit',
    recentActions: ['Bash · yarn test --forceExit', 'Modifie src/import/ingredients.ts'],
    cost: { unpriced: false, usd: 0.62 },
    usage: { cacheCreation: 4000, cacheRead: 60_000, input: 25_000, output: 5000 },
  }),
  session({
    id: '9b72d4e1',
    title: 'Migrer le logger vers OpenTelemetry',
    branch: 'feat/logger-otel',
    project: { folder: '', id: 2, name: 'outils-node', root: '/home/dev/www/outils-node' },
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
    project: { folder: '', id: 2, name: 'outils-node', root: '/home/dev/www/outils-node' },
    state: 'inactive',
    lastAction: 'Bash · npm outdated',
    lastEventAt: ago(47 * 60),
    startedAt: ago(70 * 60),
    cost: { unpriced: false, usd: 0.09 },
    usage: { cacheCreation: 0, cacheRead: 10_000, input: 7000, output: 1000 },
  }),
];

/** Groupes du fil rouge : « Perso » réunit maison et site-perso, « Node.js » outils-node. */
export const STORY_GROUPS: GroupDto[] = [
  {
    id: 2,
    name: 'Perso',
    description: null,
    instructions: '',
    defaults: { effort: null, model: null, permissionMode: null, profile: null },
    sidebar: true,
    system: false,
    projects: [
      { id: 1, name: 'maison' },
      { id: 3, name: 'site-perso' },
    ],
  },
  {
    id: 3,
    name: 'Node.js',
    description: null,
    instructions: '',
    defaults: { effort: null, model: null, permissionMode: null, profile: null },
    sidebar: true,
    system: false,
    projects: [{ id: 2, name: 'outils-node' }],
  },
];

/** Les deux sessions du fil rouge qui t'attendent : une autorisation demandée, un tour terminé. */
export const STORY_WAITING: SessionDto[] = [
  session({
    id: '7a3e5f21',
    title: 'Récapitulatif quotidien de l’agenda',
    branch: 'feat/recap',
    project: maison('packages/agenda'),
    state: 'waiting',
    lastEventAt: ago(6 * 60),
    waiting: {
      kind: 'turn',
      message: 'Le récapitulatif est généré. Veux-tu que je lance les tests ?',
      since: ago(6 * 60),
    },
    cost: { unpriced: false, usd: 0.38 },
  }),
  session({
    id: 'c41e9a07',
    title: 'Ajouter les catégories au budget du foyer',
    sourceId: 'perso',
    branch: 'feat/categories',
    project: maison('packages/budget'),
    state: 'waiting',
    lastEventAt: ago(40),
    waiting: { kind: 'permission', requestId: 'req-1', tool: 'Bash', detail: 'npm run db:migrate', since: ago(40) },
    cost: { unpriced: false, usd: 1.84 },
  }),
];

const at = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60_000).toISOString();

/** Fil de la session S3 du fil rouge. */
export const STORY_JOURNAL: JournalEntryDto[] = [
  {
    seq: 1,
    at: at(38),
    kind: 'prompt',
    text: 'Les recettes importées perdent des quantités, regarde l’import des ingrédients.',
  },
  {
    seq: 2,
    at: at(37),
    kind: 'reply',
    text: 'Je relis l’import des ingrédients, puis j’écris un test avec une quantité sur deux lignes.',
  },
  { seq: 3, at: at(36), kind: 'tool', text: 'Read · src/import/ingredients.ts' },
  {
    seq: 4,
    at: at(22),
    kind: 'reply',
    text: 'L’import sépare une quantité de son ingrédient quand elle est sur deux lignes. Je les recolle avant la lecture.',
  },
  { seq: 5, at: at(21), kind: 'tool', text: 'Edit · src/import/ingredients.ts' },
  { seq: 6, at: at(12), kind: 'tool', text: 'Edit · src/import/ingredients.test.ts' },
  {
    seq: 7,
    at: at(3),
    kind: 'reply',
    text: 'Le test de la quantité sur deux lignes est écrit. Je lance toute la suite pour vérifier que rien d’autre ne bouge.',
  },
  { seq: 8, at: at(0.2), kind: 'tool', text: 'Bash · yarn test --forceExit' },
];

/** La session S3 en cours, avec ses fichiers modifiés et ses tours. */
export const STORY_RUNNING: SessionDto = {
  ...(STORY_SESSIONS[1] as SessionDto),
  turns: 23,
  model: 'claude-sonnet-5-5',
  changedFiles: [
    { path: 'src/import/ingredients.ts', added: 24, removed: 6 },
    { path: 'src/import/ingredients.test.ts', added: 41, removed: 0 },
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

const INGREDIENTS_TS = `export function parseIngredients(lines: string[]): Ingredient[] {
  const ingredients: Ingredient[] = [];
  for (const line of lines) ingredients.push(...splitLine(line));
  return ingredients;
}`;

/** Étapes du fil rouge, une par pattern d'AI Elements : outil, terminal, tests, pile d'appels, diff, plan, sous-agent. */
export const STORY_STEPS = {
  read: toolStep(
    't1',
    'Read',
    { file_path: '/home/dev/www/maison/packages/recettes/src/import/ingredients.ts' },
    36,
    35.99,
    INGREDIENTS_TS,
  ),
  grep: toolStep('t2', 'Grep', { pattern: 'splitLine' }, 35, 34.995, 'src/import/ingredients.ts\nsrc/import/lines.ts'),
  edit: toolStep(
    't3',
    'Edit',
    {
      file_path: '/home/dev/www/maison/packages/recettes/src/import/ingredients.ts',
      old_string: '  for (const line of lines) ingredients.push(...splitLine(line));',
      new_string:
        '  for (const line of joinQuantities(lines)) {\n    // Une quantité sur deux lignes reste avec son ingrédient\n    ingredients.push(...splitLine(line));\n  }',
    },
    21,
    20.99,
    'The file has been updated.',
  ),
  terminal: toolStep(
    't4',
    'Bash',
    { command: 'yarn lint', description: 'Vérifie le lint du paquet recettes' },
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
    ' ✓ src/import/lines.test.ts (6 tests) 41ms\n ✓ keeps a quantity with its ingredient 12ms\n × reads a quantity split over two lines 8ms\n ↓ imports a scanned recipe [skipped]\n\n Tests  1 failed | 2 passed | 1 skipped (4)',
    true,
  ),
  stack: toolStep(
    't6',
    'Bash',
    { command: 'node scripts/import-recettes.mjs', description: 'Réimporte les recettes de démonstration' },
    3,
    2.98,
    "TypeError: Cannot read properties of undefined (reading 'unit')\n    at joinQuantities (src/import/ingredients.ts:14:31)\n    at parseIngredients (src/import/ingredients.ts:4:47)\n    at parse (node_modules/marked/lib/marked.cjs:1022:12)\n    at process (node_modules/marked/lib/marked.cjs:988:5)",
    true,
  ),
  plan: toolStep(
    't7',
    'TodoWrite',
    {
      todos: [
        { content: 'Relire l’import des ingrédients', status: 'completed' },
        { content: 'Recoller les quantités sur deux lignes', status: 'completed' },
        { content: 'Corriger la recette sans quantité', status: 'in_progress' },
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
        description: 'Chercher les recettes de test',
        prompt: 'Trouve les recettes de démonstration qui ont une quantité sur deux lignes.',
      },
      30,
      29.99,
      'Async agent launched successfully.',
    ),
    subagent: {
      agentType: 'Explore',
      description: 'Chercher les recettes de test',
      endedAt: at(29.2),
      finished: true,
      model: 'claude-sonnet-5-5',
      parts: [
        toolStep(
          's1',
          'Glob',
          { pattern: 'fixtures/**/*.md' },
          29.9,
          29.89,
          'fixtures/tarte-aux-pommes.md\nfixtures/gratin.md',
        ),
        toolStep(
          's2',
          'Bash',
          { command: 'grep -c "^- " fixtures/tarte-aux-pommes.md', description: 'Compte les ingrédients de la tarte' },
          29.7,
          29.69,
          '2',
        ),
        {
          at: at(29.2),
          kind: 'text' as const,
          text: 'Deux recettes ont une quantité sur deux lignes : `fixtures/tarte-aux-pommes.md` et `fixtures/gratin.md`.',
        },
      ],
      partial: false,
      prompt: 'Trouve les recettes de démonstration qui ont une quantité sur deux lignes.',
      result:
        'Deux recettes ont une quantité sur deux lignes : `fixtures/tarte-aux-pommes.md` et `fixtures/gratin.md`.',
      startedAt: at(29.95),
    },
  },
  search: toolStep(
    't11',
    'WebSearch',
    { query: 'parse recipe ingredient quantity' },
    34,
    33.99,
    'Web search results for query: "parse recipe ingredient quantity"\n\nLinks: [{"title":"Schema.org Recipe","url":"https://schema.org/Recipe"},{"title":"Ingredient phrase tagger","url":"https://github.com/nytimes/ingredient-phrase-tagger"},{"title":"recipe-ingredient-parser","url":"https://www.npmjs.com/package/recipe-ingredient-parser-v3"}]',
  ),
  fetch: toolStep(
    't12',
    'WebFetch',
    { url: 'https://schema.org/Recipe', prompt: 'Comment décrire un ingrédient ?' },
    33.5,
    33.49,
    'recipeIngredient liste chaque ingrédient avec sa quantité.',
  ),
  mcp: toolStep(
    't9',
    'mcp__github__get_issue',
    { owner: 'camille', repo: 'maison', issue_number: 42 },
    33,
    32.99,
    '{ "title": "Quantités perdues à l’import des recettes" }',
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
          text: 'Les recettes importées perdent des quantités, regarde l’import des ingrédients.',
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
          text: 'L’import lit **ligne par ligne** : une quantité sur deux lignes est séparée de son ingrédient.',
        },
        {
          at: at(37),
          kind: 'text',
          text: 'Je relis l’import des ingrédients, puis j’écris un test avec une quantité sur deux lignes.',
        },
        STORY_STEPS.read,
        STORY_STEPS.grep,
        STORY_STEPS.search,
        STORY_STEPS.fetch,
        STORY_STEPS.mcp,
        STORY_STEPS.subagent,
        {
          at: at(22),
          kind: 'text',
          text: 'L’import sépare une quantité de son ingrédient. Je recolle les lignes avant la lecture :\n\n```ts\nfor (const line of joinQuantities(lines)) ingredients.push(...splitLine(line));\n```\n\n| Recette | Quantités coupées |\n| --- | --- |\n| `tarte-aux-pommes.md` | 2 |\n| `gratin.md` | 1 |',
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
          text: 'Le test de la quantité sur deux lignes échoue encore : `joinQuantities` ne gère pas une recette **sans quantité**. Je corrige, puis je relance toute la suite.',
        },
        STORY_STEPS.running,
      ],
    },
  ],
};
