// Ce que les scénarios ne voient pas : le résumé des modifications que git donne.
import { describe, expect, it } from 'vitest';
import { shortStat } from './git-workspaces.ts';

describe('shortStat', () => {
  it('reads files, insertions and deletions, each optional', () => {
    expect(shortStat('2 files changed, 38 insertions(+), 4 deletions(-)')).toEqual({ files: 2, added: 38, removed: 4 });
    expect(shortStat('1 file changed, 1 insertion(+)')).toEqual({ files: 1, added: 1, removed: 0 });
    expect(shortStat('')).toEqual({ files: 0, added: 0, removed: 0 });
  });
});
