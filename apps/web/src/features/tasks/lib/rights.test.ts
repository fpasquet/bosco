import { describe, expect, it } from 'vitest';
import { modelLabel, rightsValue, toolLabel } from './rights';

describe('rights', () => {
  it('names the tools with their rule, and the models', () => {
    expect([toolLabel('Read'), toolLabel('Bash(npm test)'), toolLabel('Read(.env*)')]).toEqual([
      'Lire',
      'Bash (npm test)',
      'Lire (.env*)',
    ]);
    expect(modelLabel('claude-sonnet-5-5')).toBe('Sonnet 5.5');
  });

  it('reads a value as the table shows it', () => {
    expect(rightsValue('deniedTools', [])).toBe('aucun');
    expect(rightsValue('pullRequest', 'ask')).toBe('Demander à chaque fois');
  });
});
