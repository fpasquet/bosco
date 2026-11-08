import type { ConversationPartDto, ConversationStepDto, ConversationTurnDto } from '@bosco/domain';

/**
 * Lecture du fil complet d'une session (E2a) : ce que montre chaque étape de l'agent, son titre et son état. Les
 * composants des patterns d'AI Elements (Terminal, Test Results, Stack Trace, Task, Tool, Reasoning) ne lisent que ces
 * vues, calculées ici sans React.
 */

export type ToolStepDto = Extract<ConversationStepDto, { kind: 'tool' }>;
export type StepStatus = 'done' | 'error' | 'interrupted' | 'running';

/** Ce qu'une étape montre une fois dépliée. */
export type StepBody =
  | { code: string; kind: 'code'; language: string }
  | { kind: 'diff'; language: string; lines: DiffLine[] }
  | { kind: 'plan'; todos: Todo[] }
  | { kind: 'stack'; error: string; frames: { internal: boolean; line: string }[] }
  | { kind: 'search'; links: Source[] }
  | {
      agentType: null | string;
      kind: 'subagent';
      model: null | string;
      parts: ConversationPartDto[];
      partial: boolean;
      prompt: string;
      result: null | string;
    }
  | { command: string; kind: 'terminal'; output: string }
  | { command: string; kind: 'tests'; output: string; tests: TestCase[] };

export interface StepView {
  body: null | StepBody;
  /** Durée de l'étape, « 2 s » ; null tant qu'elle n'est pas finie */
  duration: null | string;
  icon: StepIcon;
  status: StepStatus;
  title: string;
}

export type StepIcon = 'edit' | 'file' | 'plan' | 'search' | 'subagent' | 'terminal' | 'tests' | 'tool' | 'web';

/** Une page lue ou trouvée par l'agent (pattern Sources) ; son titre manque pour une page lue. */
export interface Source {
  title: null | string;
  url: string;
}

export interface DiffLine {
  text: string;
  variant: 'added' | 'default' | 'removed';
}

export interface Todo {
  content: string;
  status: 'completed' | 'in_progress' | 'pending';
}

export interface TestCase {
  name: string;
  status: 'failed' | 'passed' | 'skipped';
}

/** Une commande qui lance des tests : sa sortie se lit comme un rapport de tests (Test Results). */
const TEST_COMMAND =
  /\b(?:vitest|jest|pytest|phpunit|mocha|playwright test|go test|cargo test|(?:npm|pnpm|yarn|bun) (?:run )?test)\b/;
const TEST_MARKS: Record<string, TestCase['status']> = {
  '×': 'failed',
  '↓': 'skipped',
  '○': 'skipped',
  '√': 'passed',
  '✓': 'passed',
  '✔': 'passed',
  '✕': 'failed',
  '✖': 'failed',
  '✗': 'failed',
};
const DURATION = /^\d+(?:\.\d+)?m?s$/;
const STACK_FRAME = /^\s+at\s+\S/;

const LANGUAGES: Record<string, string> = {
  cjs: 'javascript',
  css: 'css',
  diff: 'diff',
  go: 'go',
  graphql: 'graphql',
  html: 'html',
  ini: 'ini',
  java: 'java',
  js: 'javascript',
  json: 'json',
  jsx: 'jsx',
  md: 'markdown',
  mjs: 'javascript',
  mts: 'typescript',
  php: 'php',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  scss: 'scss',
  sh: 'bash',
  sql: 'sql',
  toml: 'toml',
  ts: 'typescript',
  tsx: 'tsx',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
};

/** Langage de coloration d'un fichier, d'après son extension. */
export function languageOf(path: string): string {
  if (/(?:^|\/)Dockerfile$/.test(path)) return 'docker';
  const extension = /\.([a-z0-9]+)$/i.exec(path)?.[1]?.toLowerCase() ?? '';
  return LANGUAGES[extension] ?? '';
}

function text(input: Record<string, unknown>, key: string): string {
  const value = input[key];
  return typeof value === 'string' ? value : '';
}

/** Première ligne d'une commande, assez courte pour un titre. */
function firstLine(value: string): string {
  const line = value.trim().split('\n')[0] ?? '';
  return line.length > 120 ? `${line.slice(0, 119)}…` : line;
}

/** Nom court d'un fichier : son chemin à partir du dépôt quand on le devine, sinon ses deux derniers dossiers. */
export function shortPath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts.length > 3 ? `…/${parts.slice(-3).join('/')}` : path;
}

/** Durée d'une étape, en secondes ou en minutes. */
export function durationOf(start: string, end: null | string): null | string {
  if (!end) return null;
  const seconds = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000));
  return seconds < 60 ? `${seconds} s` : `${Math.round(seconds / 60)} min`;
}

/** État d'un outil : en cours tant que la session tourne, interrompu si elle s'est arrêtée sans son résultat. */
export function statusOf(step: ToolStepDto, live: boolean): StepStatus {
  if (step.error) return 'error';
  // Un sous-agent lancé en arrière-plan rend la main tout de suite : il tourne tant qu'il n'a pas fini
  if (step.subagent && !step.subagent.finished) return live ? 'running' : 'interrupted';
  if (step.endedAt) return 'done';
  return live ? 'running' : 'interrupted';
}

/** Les cas d'une sortie de tests : ✓ réussi, × en échec, ↓ ignoré (Vitest, Jest, Playwright, Mocha). */
export function parseTests(output: string): TestCase[] {
  const tests: TestCase[] = [];
  for (const line of output.split('\n')) {
    const [mark = '', ...words] = line.trim().split(/\s+/);
    const status = TEST_MARKS[mark];
    // La durée finale (« 12ms ») et la mention « [skipped] » ne font pas partie du nom
    while (words.length && (DURATION.test(words.at(-1) ?? '') || words.at(-1) === '[skipped]')) words.pop();
    if (status && words.length) tests.push({ name: words.join(' '), status });
  }
  return tests;
}

/** Une erreur suivie de sa pile d'appels (« at fn (fichier:ligne:colonne) »), ou null. */
export function parseStack(output: string): null | { error: string; frames: { internal: boolean; line: string }[] } {
  const lines = output.split('\n');
  const frames = lines.filter((line) => STACK_FRAME.test(line)).map((line) => line.trim());
  if (frames.length < 2) return null;
  const error = lines.find((line) => line.trim() && !STACK_FRAME.test(line))?.trim() ?? frames[0] ?? '';
  return { error, frames: frames.map((line) => ({ internal: line.includes('node_modules'), line })) };
}

/** Au-delà, deux textes se comparent en bloc : les lignes retirées, puis les lignes ajoutées. */
const DIFF_LIMIT = 400;

/** Longueur de la plus longue suite commune de lignes à partir de chaque position (i, j). */
function commonLengths(old: string[], next: string[]): (i: number, j: number) => number {
  const width = next.length + 1;
  const table = new Uint16Array((old.length + 1) * width);
  const common = (i: number, j: number) => table[i * width + j] ?? 0;
  for (let i = old.length - 1; i >= 0; i--)
    for (let j = next.length - 1; j >= 0; j--)
      table[i * width + j] =
        old[i] === next[j] ? common(i + 1, j + 1) + 1 : Math.max(common(i + 1, j), common(i, j + 1));
  return common;
}

/** Lignes d'un remplacement, ajoutées ou retirées, d'après leur plus longue suite commune. */
export function diffLines(before: string, after: string): DiffLine[] {
  const old = before ? before.split('\n') : [];
  const next = after ? after.split('\n') : [];
  if (old.length > DIFF_LIMIT || next.length > DIFF_LIMIT)
    return [
      ...old.map((line) => ({ text: line, variant: 'removed' as const })),
      ...next.map((line) => ({ text: line, variant: 'added' as const })),
    ];
  const common = commonLengths(old, next);
  const lines: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < old.length || j < next.length) {
    const removed = old[i];
    const added = next[j];
    if (removed !== undefined && removed === added) {
      lines.push({ text: removed, variant: 'default' });
      i++;
      j++;
    } else if (removed !== undefined && (added === undefined || common(i + 1, j) >= common(i, j + 1))) {
      lines.push({ text: removed, variant: 'removed' });
      i++;
    } else {
      lines.push({ text: added ?? '', variant: 'added' });
      j++;
    }
  }
  return lines;
}

function todosOf(input: Record<string, unknown>): Todo[] {
  const todos = Array.isArray(input.todos) ? input.todos : [];
  return todos.flatMap((todo: unknown) => {
    if (typeof todo !== 'object' || todo === null) return [];
    const { content, status } = todo as Record<string, unknown>;
    if (typeof content !== 'string') return [];
    const known = status === 'completed' || status === 'in_progress' ? status : 'pending';
    return [{ content, status: known }];
  });
}

function editBody(step: ToolStepDto): StepBody {
  const path = text(step.input, 'file_path');
  const language = languageOf(path);
  if (step.name === 'Write') return { kind: 'code', code: text(step.input, 'content'), language };
  const edits = Array.isArray(step.input.edits) ? (step.input.edits as Record<string, unknown>[]) : [step.input];
  return {
    kind: 'diff',
    language,
    lines: edits.flatMap((edit) => diffLines(text(edit, 'old_string'), text(edit, 'new_string'))),
  };
}

const HEREDOC = /<<-?\s*['"]?(\w+)['"]?/;

/** Une commande sans le corps de ses heredocs : le contenu d'un fichier écrit par cat n'est pas la commande lancée. */
export function withoutHeredocs(command: string): string {
  const kept: string[] = [];
  let delimiter: null | string = null;
  for (const line of command.split('\n')) {
    if (delimiter) {
      if (line.trim() === delimiter) delimiter = null;
      continue;
    }
    kept.push(line);
    delimiter = HEREDOC.exec(line)?.[1] ?? null;
  }
  return kept.join('\n');
}

/** Titre d'une commande : la description que l'agent en donne, sinon la commande elle-même. */
function commandTitle(step: ToolStepDto, status: StepStatus, command: string): string {
  const description = firstLine(text(step.input, 'description'));
  if (status === 'error') return description ? `${description} : échec` : `${command} a échoué`;
  return description || `${verb(status, 'Lance', 'A lancé')} ${command}`;
}

function commandView(step: ToolStepDto, status: StepStatus): Omit<StepView, 'duration' | 'status'> {
  const full = text(step.input, 'command').trim();
  const command = firstLine(full);
  const output = step.output ?? '';
  const stack = step.error ? parseStack(output) : null;
  if (stack) return { body: { kind: 'stack', ...stack }, icon: 'terminal', title: `Échec : ${stack.error}` };
  const title = commandTitle(step, status, command);
  if (TEST_COMMAND.test(withoutHeredocs(full))) {
    const tests = parseTests(output);
    const failed = tests.filter((test) => test.status === 'failed').length;
    const failures = failed ? `, ${failed} en échec` : '';
    const noun = tests.length > 1 ? 'tests' : 'test';
    const counts = tests.length ? ` · ${tests.length} ${noun}${failures}` : '';
    return {
      body: step.output === null ? null : { command: full, kind: 'tests', output, tests },
      icon: 'tests',
      title: `${title}${counts}`,
    };
  }
  return { body: step.output === null ? null : { command: full, kind: 'terminal', output }, icon: 'terminal', title };
}

function verb(status: StepStatus, running: string, done: string): string {
  return status === 'running' ? running : done;
}

/** Titre, icône et contenu d'un outil, selon l'outil appelé (Terminal, Test Results, Stack Trace, Task, Tool). */
function toolView(step: ToolStepDto, status: StepStatus): Omit<StepView, 'duration' | 'status'> {
  const path = shortPath(text(step.input, 'file_path') || text(step.input, 'path'));
  const output = step.output ?? '';
  const result = (language = ''): StepBody | null =>
    step.output === null ? null : { kind: 'code', code: output, language };
  switch (step.name) {
    case 'Bash':
      return commandView(step, status);
    case 'Read':
      return { body: result(languageOf(path)), icon: 'file', title: `${verb(status, 'Lit', 'A lu')} ${path}` };
    case 'Edit':
    case 'MultiEdit':
    case 'Write':
      return {
        body: editBody(step),
        icon: 'edit',
        title: `${verb(status, step.name === 'Write' ? 'Écrit' : 'Modifie', step.name === 'Write' ? 'A écrit' : 'A modifié')} ${path}`,
      };
    case 'Glob':
    case 'Grep':
      return {
        body: result(),
        icon: 'search',
        title: `${verb(status, 'Cherche', 'A cherché')} « ${text(step.input, 'pattern')} »`,
      };
    case 'WebFetch':
      return {
        body: result('markdown'),
        icon: 'web',
        title: `${verb(status, 'Consulte', 'A consulté')} ${text(step.input, 'url')}`,
      };
    case 'WebSearch': {
      const links = searchLinks(output);
      return {
        body: links.length ? { kind: 'search', links } : result('markdown'),
        icon: 'search',
        title: `${verb(status, 'Cherche', 'A cherché')} « ${text(step.input, 'query')} » sur le Web`,
      };
    }
    case 'TodoWrite': {
      const todos = todosOf(step.input);
      const done = todos.filter((todo) => todo.status === 'completed').length;
      return { body: { kind: 'plan', todos }, icon: 'plan', title: `Plan · ${done} sur ${todos.length} faites` };
    }
    case 'TaskCreate':
      return { body: null, icon: 'plan', title: `Ajoute au plan : ${text(step.input, 'subject')}` };
    case 'TaskUpdate':
      return { body: null, icon: 'plan', title: taskUpdateTitle(step.input) };
    case 'TaskList': {
      const todos = listedTasks(output);
      return { body: todos.length ? { kind: 'plan', todos } : result(), icon: 'plan', title: 'Consulte le plan' };
    }
    case 'Agent':
    case 'Task':
      return subagentView(step, status);
    default:
      return {
        body: { kind: 'code', code: inputAndOutput(step), language: 'json' },
        icon: 'tool',
        title: `${verb(status, 'Utilise', 'A utilisé')} ${toolName(step.name)}`,
      };
  }
}

/** Les étapes d'un sous-agent fini, sans son dernier texte, rendu à part comme son résultat. */
function withoutResult(parts: ConversationPartDto[], result: null | string): ConversationPartDto[] {
  const last = parts.at(-1);
  return result && last?.kind === 'text' && last.text === result ? parts.slice(0, -1) : parts;
}

/** Sous-agent (pattern Subagent) : sa consigne, son modèle et ses étapes, puis son résultat une fois fini. */
function subagentView(step: ToolStepDto, status: StepStatus): Omit<StepView, 'duration' | 'status'> {
  const subagent = step.subagent;
  const name =
    subagent?.description ?? (text(step.input, 'description') || text(step.input, 'subagent_type') || 'tâche');
  const titles = {
    done: 'Sous-agent',
    error: 'Sous-agent en échec',
    interrupted: 'Sous-agent',
    running: 'Sous-agent en cours',
  };
  return {
    body: {
      agentType: subagent?.agentType ?? (text(step.input, 'subagent_type') || null),
      kind: 'subagent',
      model: subagent?.model ?? null,
      parts: subagent ? withoutResult(subagent.parts, subagent.result) : [],
      partial: subagent?.partial ?? false,
      prompt: subagent?.prompt ?? text(step.input, 'prompt'),
      // Sans son transcript, le résultat est celui que l'appel a rendu
      result: subagent ? subagent.result : step.output,
    },
    icon: 'subagent',
    title: `${titles[status]} · ${name}`,
  };
}

/** Liens d'une recherche web, lus dans sa sortie (« Links: [{"title":…,"url":…}] »). */
export function searchLinks(output: string): Source[] {
  const start = output.indexOf('Links: [');
  if (start < 0) return [];
  const from = start + 'Links: '.length;
  // La liste finit au premier crochet fermant qui donne un JSON valide
  for (let end = output.indexOf(']', from); end > 0; end = output.indexOf(']', end + 1)) {
    try {
      const links: unknown = JSON.parse(output.slice(from, end + 1));
      if (!Array.isArray(links)) return [];
      return links.flatMap((link: unknown) => {
        const { title, url } = (link ?? {}) as Record<string, unknown>;
        return typeof url === 'string' ? [{ title: typeof title === 'string' ? title : null, url }] : [];
      });
    } catch {
      // Crochet d'un titre : on cherche le suivant
    }
  }
  return [];
}

/** Pages d'un outil : celle qu'une lecture web a ouverte, ou les liens d'une recherche. */
function sourcesOfStep(part: ConversationPartDto): Source[] {
  if (part.kind !== 'tool' || part.error) return [];
  if (part.name === 'WebFetch' && part.endedAt) {
    const url = text(part.input, 'url');
    return url ? [{ title: null, url }] : [];
  }
  return part.name === 'WebSearch' ? searchLinks(part.output ?? '') : [];
}

/** Sources d'un tour de l'agent : pages lues et liens trouvés, chacun une fois. */
export function sourcesOf(parts: ConversationPartDto[]): Source[] {
  const sources = new Map<string, Source>();
  for (const source of parts.flatMap(sourcesOfStep)) if (!sources.has(source.url)) sources.set(source.url, source);
  return [...sources.values()];
}

/** Nom d'hôte d'une adresse, ou l'adresse elle-même si elle ne se lit pas. */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/** Nom lisible d'un outil : « search_issues (github) » pour un outil d'un serveur MCP. */
export function toolName(name: string): string {
  if (!name.startsWith('mcp__')) return name;
  const rest = name.slice('mcp__'.length);
  const separator = rest.indexOf('__');
  return separator > 0 ? `${rest.slice(separator + 2)} (${rest.slice(0, separator)})` : name;
}

function inputAndOutput(step: ToolStepDto): string {
  const input = JSON.stringify(step.input, null, 2);
  return step.output === null ? input : `${input}\n\n${step.output}`;
}

/** Vue d'un outil : titre au présent tant qu'il tourne, au passé une fois fini, « Échec » s'il a échoué. */
export function stepView(step: ToolStepDto, live: boolean): StepView {
  const status = statusOf(step, live);
  const view = toolView(step, status);
  const duration = step.subagent
    ? durationOf(step.subagent.startedAt ?? step.at, step.subagent.endedAt)
    : durationOf(step.at, step.endedAt);
  return { ...view, duration, status };
}

/** Parties d'un tour de l'agent : un texte, ou une suite d'étapes rendue dans une même trace. */
export type PartGroup = { kind: 'steps'; steps: ConversationStepDto[] } | { kind: 'text'; text: string };

export function groupParts(parts: ConversationPartDto[]): PartGroup[] {
  const groups: PartGroup[] = [];
  for (const part of parts) {
    if (part.kind === 'text') {
      groups.push({ kind: 'text', text: part.text });
      continue;
    }
    const last = groups.at(-1);
    if (last?.kind === 'steps') last.steps.push(part);
    else groups.push({ kind: 'steps', steps: [part] });
  }
  return groups;
}

/** Au-delà de ce nombre d'étapes à la suite, elles se replient sous une tâche (Task) qui les résume. */
export const TASK_THRESHOLD = 4;

/** Résumé d'une suite d'étapes : « 5 commandes, 3 fichiers lus, 2 fichiers modifiés ». */
export function summarizeSteps(steps: ConversationStepDto[]): string {
  const counts = new Map<string, number>();
  const add = (label: string) => counts.set(label, (counts.get(label) ?? 0) + 1);
  for (const step of steps) {
    if (step.kind === 'reasoning') add('réflexion');
    else if (step.name === 'Bash') add('commande');
    else if (step.name === 'Read') add('lecture');
    else if (['Edit', 'MultiEdit', 'Write'].includes(step.name)) add('modification');
    else if (['Glob', 'Grep', 'WebSearch'].includes(step.name)) add('recherche');
    else if (PLAN_TOOLS.has(step.name)) add('mise à jour du plan');
    else add('outil');
  }
  return [...counts].map(([label, count]) => `${count} ${count > 1 ? plural(label) : label}`).join(', ');
}

function plural(label: string): string {
  if (label === 'mise à jour du plan') return 'mises à jour du plan';
  return label === 'réflexion' ? 'réflexions' : `${label}s`;
}

/** Outils du plan de l'agent : la liste entière (TodoWrite), ou une tâche à la fois (TaskCreate, TaskUpdate). */
const PLAN_TOOLS = new Set(['TaskCreate', 'TaskList', 'TaskUpdate', 'TodoWrite']);

const UPDATE_VERBS: Record<string, string> = {
  completed: 'Termine',
  deleted: 'Retire',
  in_progress: 'Commence',
};

/** « Termine la tâche : Rédiger le résumé » ; le nom de la tâche vient de sa création (planOf). */
function taskUpdateTitle(input: Record<string, unknown>): string {
  const verb = UPDATE_VERBS[text(input, 'status')] ?? 'Met à jour';
  const subject = text(input, 'subject');
  return subject ? `${verb} la tâche : ${subject}` : `${verb} la tâche n° ${text(input, 'taskId')}`;
}

/** Tâches listées par TaskList : « #1 [in_progress] Rédiger le résumé ». */
function listedTasks(output: string): Todo[] {
  return output.split('\n').flatMap((line) => {
    const [, status, content] = /^#\w+ \[(\w+)\] (.+)$/.exec(line.trim()) ?? [];
    if (!status || !content) return [];
    return [{ content, status: status === 'completed' || status === 'in_progress' ? status : 'pending' }];
  });
}

/**
 * Le plan de l'agent au fil de la conversation : l'état de ses tâches à la fin de chaque tour qui l'a changé (Queue),
 * et les mises à jour nommées d'après leur tâche. TodoWrite remplace toute la liste, TaskCreate et TaskUpdate une
 * tâche à la fois.
 */
export function planOf(turns: ConversationTurnDto[]): { plans: Map<string, Todo[]>; turns: ConversationTurnDto[] } {
  const tasks = new Map<string, Todo>();
  const plans = new Map<string, Todo[]>();
  const named = turns.map((turn) => {
    let changed = false;
    const parts = turn.parts.map((part) => {
      if (part.kind !== 'tool' || !PLAN_TOOLS.has(part.name) || part.error) return part;
      // Le nom de la tâche se lit avant la mise à jour : une tâche retirée n'est plus dans le plan après
      const subject = part.name === 'TaskUpdate' ? tasks.get(text(part.input, 'taskId'))?.content : undefined;
      changed = applyPlan(tasks, part) || changed;
      return subject && !text(part.input, 'subject') ? { ...part, input: { ...part.input, subject } } : part;
    });
    if (changed) plans.set(turn.id, [...tasks.values()]);
    return { ...turn, parts };
  });
  return { plans, turns: named };
}

/** Applique un appel du plan ; vrai quand l'état des tâches a changé. */
function applyPlan(tasks: Map<string, Todo>, step: ToolStepDto): boolean {
  if (step.name === 'TodoWrite') {
    tasks.clear();
    for (const [index, todo] of todosOf(step.input).entries()) tasks.set(String(index + 1), todo);
    return true;
  }
  if (step.name === 'TaskCreate') {
    const id = /Task #(\w+) created/.exec(step.output ?? '')?.[1];
    if (!id) return false;
    tasks.set(id, { content: text(step.input, 'subject'), status: 'pending' });
    return true;
  }
  if (step.name !== 'TaskUpdate') return false;
  const id = text(step.input, 'taskId');
  const task = tasks.get(id);
  if (!task) return false;
  const status = text(step.input, 'status');
  if (status === 'deleted') tasks.delete(id);
  else
    tasks.set(id, {
      content: text(step.input, 'subject') || task.content,
      status: status === 'completed' || status === 'in_progress' || status === 'pending' ? status : task.status,
    });
  return true;
}
