import { describe, expect, it } from 'vitest';
import type { ToolStepDto } from './conversation';
import { diffLines, groupParts, parseStack, parseTests, stepView, summarizeSteps, toolName } from './conversation';

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
      body: { kind: 'terminal', output: '$ yarn lint\nDone in 1.2s' },
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
