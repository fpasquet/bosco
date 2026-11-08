// Ce que les scénarios ne voient pas : le décompte des lignes d'un remplacement et le cumul par fichier.
import { describe, expect, it } from 'vitest';
import { changeOf, lineChanges, mergeChange } from './file-change.ts';

describe('lineChanges', () => {
  it('counts only the lines that really changed', () => {
    expect(lineChanges('a\nb\nc', 'a\nB\nc\nd')).toEqual({ added: 2, removed: 1 });
    expect(lineChanges('', 'x\ny\n')).toEqual({ added: 2, removed: 0 });
  });
});

describe('changeOf', () => {
  it('reads Edit, MultiEdit and Write, and ignores the other tools', () => {
    expect(changeOf('Edit', { file_path: 'src/a.ts', old_string: 'x', new_string: 'x\ny' })).toEqual({
      path: 'src/a.ts',
      added: 1,
      removed: 0,
    });
    expect(
      changeOf('MultiEdit', {
        file_path: 'src/b.ts',
        edits: [
          { old_string: 'a', new_string: 'b' },
          { old_string: '', new_string: 'c' },
        ],
      }),
    ).toEqual({ path: 'src/b.ts', added: 2, removed: 1 });
    expect(changeOf('Write', { file_path: 'README.md', content: 'un\ndeux\n' })).toEqual({
      path: 'README.md',
      added: 2,
      removed: 0,
    });
    expect(changeOf('Bash', { command: 'rm -rf dist' })).toBeNull();
  });
});

describe('mergeChange', () => {
  it('adds up the changes of a file', () => {
    const once = mergeChange([], { path: 'a.ts', added: 3, removed: 1 });
    expect(mergeChange(once, { path: 'a.ts', added: 1, removed: 2 })).toEqual([{ path: 'a.ts', added: 4, removed: 3 }]);
  });
});
