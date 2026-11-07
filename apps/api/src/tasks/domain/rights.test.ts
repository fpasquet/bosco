// Ce que les scénarios ne voient pas : l'origine de chaque droit et les limites d'un dépôt (E8a).
import { describe, expect, it } from 'vitest';
import { DEFAULT_RIGHTS, effectiveRights, isTool, overreach } from './rights.ts';

const GENERAL = { ...DEFAULT_RIGHTS, maxTurns: 40, maxBudgetUsd: 5, deniedTools: ['Bash(curl:*)'] };

describe('rights', () => {
  it('takes each right from the repository when it has one, and adds the denied tools', () => {
    const { origins, rights } = effectiveRights(GENERAL, { maxTurns: 30, deniedTools: ['Bash(npm publish:*)'] });
    expect(rights.maxTurns).toBe(30);
    expect(rights.deniedTools).toEqual(['Bash(curl:*)', 'Bash(npm publish:*)']);
    expect([origins.maxTurns, origins.model, origins.deniedTools]).toEqual(['dépôt', 'général', 'général + dépôt']);
  });

  it('lets a repository tighten the general rights, never exceed them', () => {
    expect(overreach(GENERAL, { maxBudgetUsd: 2, tools: ['Read', 'Bash(npm test)'] })).toBeNull();
    expect(overreach(GENERAL, { maxBudgetUsd: 6 })).not.toBeNull();
    expect(overreach({ ...GENERAL, tools: ['Read'] }, { tools: ['Read', 'Write'] })).not.toBeNull();
  });

  it('accepts a tool with its rule, never an option', () => {
    expect([isTool('Bash(npm test)'), isTool('Read(.env*)'), isTool('--dangerously-skip-permissions')]).toEqual([
      true,
      true,
      false,
    ]);
  });
});
