// Ce que les scénarios ne voient pas : la cible de chaque sorte d'outil, lue par le paquet ou par Bosco.
import { describe, expect, it } from 'vitest';
import { actionTargetOf, describeAction } from './action-summary.ts';

describe('actionTargetOf', () => {
  it('shows the command, the file written, the file read, the pattern or the address', () => {
    expect([
      actionTargetOf('Bash', { command: 'npm run db:migrate', description: 'Migrate' }),
      actionTargetOf('Edit', { file_path: '/home/dev/www/api-tarifs/src/logger/index.ts', old_string: 'a' }),
      actionTargetOf('NotebookEdit', { notebook_path: '/home/dev/www/api-tarifs/notes.ipynb' }),
      actionTargetOf('Read', { file_path: '/home/dev/www/api-tarifs/README.md' }),
      actionTargetOf('Grep', { path: 'src', pattern: 'TODO' }),
      actionTargetOf('WebFetch', { prompt: 'Résume', url: 'https://pypi.org' }),
      actionTargetOf('mcp__bosco__bosco_context', { command: 'context' }),
    ]).toEqual([
      'npm run db:migrate',
      '/home/dev/www/api-tarifs/src/logger/index.ts',
      '/home/dev/www/api-tarifs/notes.ipynb',
      '/home/dev/www/api-tarifs/README.md',
      'TODO',
      'https://pypi.org',
      'context',
    ]);
  });

  it('shows nothing for an empty command, a tool without target or an input that is not an object', () => {
    expect([
      actionTargetOf('Bash', { command: '  ' }),
      actionTargetOf('TodoWrite', { todos: [] }),
      actionTargetOf('Read', 'README.md'),
    ]).toEqual([null, null, null]);
  });
});

describe('describeAction', () => {
  it('writes a multi-line command on one line, cut at 280 characters', () => {
    const { detail, summary } = describeAction('Bash', { command: `cat <<EOF\n${'x'.repeat(400)}\nEOF` });
    expect([detail?.length, detail?.startsWith('cat <<EOF x'), summary.startsWith('Bash · cat <<EOF')]).toEqual([
      280,
      true,
      true,
    ]);
  });
});
