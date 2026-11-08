import { describe, expect, it } from 'vitest';
import type { ToolStepDto } from './conversation';
import {
  diffLines,
  groupParts,
  parseStack,
  parseTests,
  planOf,
  searchLinks,
  sourcesOf,
  stepView,
  summarizeSteps,
  toolName,
} from './conversation';

const tool = (name: string, input: Record<string, unknown>, result: Partial<ToolStepDto> = {}): ToolStepDto => ({
  at: '2026-11-08T09:00:00Z',
  endedAt: '2026-11-08T09:00:02Z',
  error: false,
  id: 't1',
  input,
  kind: 'tool',
  name,
  output: 'ok',
  summary: name,
  ...result,
});

describe('stepView', () => {
  it('shows a command as a terminal, running then done, and failed with its exit', () => {
    const step = tool('Bash', { command: 'yarn lint' }, { output: 'Done in 1.2s' });
    expect(stepView({ ...step, endedAt: null, output: null }, true)).toMatchObject({
      body: null,
      status: 'running',
      title: 'Lance yarn lint',
    });
    expect(stepView(step, false)).toMatchObject({
      body: { command: 'yarn lint', kind: 'terminal', output: 'Done in 1.2s' },
      duration: '2 s',
      status: 'done',
      title: 'A lancé yarn lint',
    });
    expect(stepView({ ...step, error: true }, false).title).toBe('yarn lint a échoué');
  });

  it('titles a command with the description the agent gives it', () => {
    const step = tool('Bash', { command: 'cd apps/web && npx eslint src', description: 'Lint the web app' });
    expect(stepView(step, false).title).toBe('Lint the web app');
    expect(stepView({ ...step, error: true }, false).title).toBe('Lint the web app : échec');
  });

  it('marks a tool left without result once the session stopped', () => {
    expect(stepView(tool('Read', { file_path: 'a.ts' }, { endedAt: null, output: null }), false).status).toBe(
      'interrupted',
    );
  });

  it('reads a test command as test results, with its failures counted', () => {
    const output = ' ✓ creates a user 12ms\n × updates a user profile 8ms\n ↓ deletes a user [skipped]';
    const view = stepView(tool('Bash', { command: 'pnpm test' }, { error: true, output }), false);
    expect(view.title).toBe('pnpm test a échoué · 3 tests, 1 en échec');
    expect(view.body).toMatchObject({
      kind: 'tests',
      tests: [
        { name: 'creates a user', status: 'passed' },
        { name: 'updates a user profile', status: 'failed' },
        { name: 'deletes a user', status: 'skipped' },
      ],
    });
  });

  it('does not take a file written by a heredoc for a test run', () => {
    const command = "cat > a.test.ts <<'EOF'\nimport { it } from 'vitest';\nEOF\nyarn lint";
    expect(stepView(tool('Bash', { command }), false).icon).toBe('terminal');
    expect(stepView(tool('Bash', { command: `${command} && npx vitest run` }), false).icon).toBe('tests');
  });

  it('shows a failed command with a stack trace as a stack trace', () => {
    const output =
      'TypeError: Cannot read properties of undefined\n    at formatInvoice (app/lib/billing.ts:42:31)\n    at run (node_modules/x/index.js:1:1)';
    const view = stepView(tool('Bash', { command: 'node app.js' }, { error: true, output }), false);
    expect(view.title).toBe('Échec : TypeError: Cannot read properties of undefined');
    expect(view.body).toMatchObject({ kind: 'stack', frames: [{ internal: false }, { internal: true }] });
  });

  it('shows an edit as a diff, a plan as its todos, and an MCP tool by its name', () => {
    const edit = stepView(tool('Edit', { file_path: '/repo/src/a.ts', old_string: 'a\nb', new_string: 'a\nc' }), false);
    expect(edit.title).toBe('A modifié /repo/src/a.ts');
    expect(edit.body).toMatchObject({
      kind: 'diff',
      language: 'typescript',
      lines: [
        { text: 'a', variant: 'default' },
        { text: 'b', variant: 'removed' },
        { text: 'c', variant: 'added' },
      ],
    });
    const plan = stepView(
      tool('TodoWrite', {
        todos: [
          { content: 'Lire', status: 'completed' },
          { content: 'Corriger', status: 'in_progress' },
        ],
      }),
      false,
    );
    expect(plan.title).toBe('Plan · 1 sur 2 faites');
    expect(toolName('mcp__github__search_issues')).toBe('search_issues (github)');
  });
});

describe('parsing', () => {
  it('finds no test and no stack in an ordinary output', () => {
    expect(parseTests('Done in 1.2s')).toEqual([]);
    expect(parseStack('Error: boom\n    at one (a.ts:1:1)')).toBeNull();
  });

  it('diffs two texts by lines', () => {
    expect(diffLines('', 'x')).toEqual([{ text: 'x', variant: 'added' }]);
    expect(diffLines('x', '')).toEqual([{ text: 'x', variant: 'removed' }]);
  });
});

describe('groupParts', () => {
  it('keeps texts apart and groups the steps between them, then summarizes a group', () => {
    const at = '2026-11-08T09:00:00Z';
    const groups = groupParts([
      { at, kind: 'text', text: 'Je regarde.' },
      { at, kind: 'reasoning', seconds: 3, text: '' },
      tool('Bash', { command: 'ls' }),
      tool('Bash', { command: 'pwd' }),
      tool('Read', { file_path: 'a.ts' }),
      { at, kind: 'text', text: 'Fini.' },
    ]);
    expect(groups.map((group) => group.kind)).toEqual(['text', 'steps', 'text']);
    const steps = groups[1]?.kind === 'steps' ? groups[1].steps : [];
    expect(summarizeSteps(steps)).toBe('1 réflexion, 2 commandes, 1 lecture');
  });
});

describe('subagents', () => {
  const subagent = {
    agentType: 'Explore',
    description: 'PDF de test',
    endedAt: '2026-11-08T09:00:48Z',
    finished: true,
    model: 'claude-sonnet-5-5',
    parts: [],
    partial: false,
    prompt: 'Trouve les PDF avec un tableau.',
    result: 'Un PDF : `devis.pdf`.',
    startedAt: '2026-11-08T09:00:00Z',
  };

  it('shows a finished subagent with its model, prompt, result and run time', () => {
    const view = stepView(tool('Agent', { description: 'PDF de test' }, { subagent }), true);
    expect(view).toMatchObject({
      body: { agentType: 'Explore', kind: 'subagent', model: 'claude-sonnet-5-5', result: 'Un PDF : `devis.pdf`.' },
      duration: '48 s',
      status: 'done',
      title: 'Sous-agent · PDF de test',
    });
  });

  it('keeps a background subagent running until it finishes, interrupted once the session stopped', () => {
    const running = { ...subagent, endedAt: null, finished: false, result: null };
    const step = tool('Agent', { description: 'PDF de test' }, { subagent: running });
    expect(stepView(step, true)).toMatchObject({ status: 'running', title: 'Sous-agent en cours · PDF de test' });
    expect(stepView(step, false).status).toBe('interrupted');
  });

  it('falls back on the call result without the subagent transcript', () => {
    const view = stepView(tool('Task', { description: 'PDF de test', prompt: 'Cherche.' }, { output: 'Rien.' }), false);
    expect(view.body).toMatchObject({ kind: 'subagent', parts: [], prompt: 'Cherche.', result: 'Rien.' });
  });
});

describe('sources', () => {
  const output =
    'Web search results for query: "pdf.js tables"\n\nLinks: [{"title":"pdf.js [docs]","url":"https://mozilla.github.io/pdf.js/"},{"title":"Tables","url":"https://example.com/tables"}]\n\nRésumé.';

  it('reads the links of a web search, even with a bracket in a title', () => {
    expect(searchLinks(output)).toEqual([
      { title: 'pdf.js [docs]', url: 'https://mozilla.github.io/pdf.js/' },
      { title: 'Tables', url: 'https://example.com/tables' },
    ]);
    expect(searchLinks('No links here')).toEqual([]);
  });

  it('gathers the pages read and found in a turn, once each', () => {
    const sources = sourcesOf([
      tool('WebSearch', { query: 'pdf.js tables' }, { output }),
      tool('WebFetch', { url: 'https://mozilla.github.io/pdf.js/' }),
      tool('WebFetch', { url: 'https://broken.example' }, { error: true }),
    ]);
    expect(sources.map((source) => source.url)).toEqual([
      'https://mozilla.github.io/pdf.js/',
      'https://example.com/tables',
    ]);
    expect(stepView(tool('WebSearch', { query: 'pdf.js tables' }, { output }), false).body).toMatchObject({
      kind: 'search',
    });
  });
});

describe('planOf', () => {
  it('rebuilds the plan from TaskCreate and TaskUpdate, and names each update after its task', () => {
    const at = '2026-11-08T09:00:00Z';
    const create = (id: string, subject: string) =>
      tool('TaskCreate', { subject }, { id: `c${id}`, output: `Task #${id} created successfully: ${subject}` });
    const update = (id: string, status: string) =>
      tool('TaskUpdate', { taskId: id, status }, { id: `u${id}${status}` });
    const { plans, turns } = planOf([
      { at, id: 'u1', parts: [{ at, kind: 'text', text: 'Revue du projet' }], role: 'user' },
      {
        at,
        id: 'a1',
        parts: [create('1', 'Lister les applications'), create('2', 'Rédiger le résumé'), update('1', 'completed')],
        role: 'assistant',
      },
    ]);
    expect(plans.get('a1')).toEqual([
      { content: 'Lister les applications', status: 'completed' },
      { content: 'Rédiger le résumé', status: 'pending' },
    ]);
    expect(plans.has('u1')).toBe(false);
    const named = turns[1]?.parts[2];
    expect(named?.kind === 'tool' ? stepView(named, false).title : null).toBe(
      'Termine la tâche : Lister les applications',
    );
  });
});
