import { describe, expect, it } from 'vitest';
import { parseDiff } from './diff';

describe('parseDiff', () => {
  it('splits a unified diff by file and line kind', () => {
    const [file] = parseDiff(
      'diff --git a/lexique.json b/lexique.json\nindex 1..2 100644\n--- a/lexique.json\n+++ b/lexique.json\n@@ -1,2 +1,2 @@\n {\n-  "RATP": ""\n+  "SNCF": "èss"\n',
    );
    expect(file?.path).toBe('lexique.json');
    expect(file?.lines.map(({ kind }) => kind)).toEqual(['hunk', 'context', 'removed', 'added']);
  });
});
