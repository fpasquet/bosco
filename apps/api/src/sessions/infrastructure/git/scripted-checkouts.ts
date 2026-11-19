// Branches et worktrees factices des scénarios (BOSCO_TEST=1) : les projets n'y sont pas de vrais dépôts. Chaque projet
// git est sur main, a un worktree sur feat/tarifs et une branche develop ; un worktree créé est un dossier vide.
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Checkouts } from '../../application/pilot.service.ts';
import { type ProjectCheckouts, worktreePathOf } from '../../domain/checkout.ts';

export class ScriptedCheckouts implements Checkouts {
  async list(root: string): Promise<ProjectCheckouts> {
    const worktree = join(root, '.claude', 'worktrees', 'tarifs');
    // Le dossier du worktree existe, pour qu'une session puisse y tourner
    await mkdir(worktree, { recursive: true });
    return {
      active: 'main',
      branches: ['develop'],
      worktrees: [{ branch: 'feat/tarifs', head: 'scripted-head', path: worktree }],
    };
  }

  async addWorktree(root: string, branch: string): Promise<string> {
    const path = worktreePathOf(root, branch);
    await mkdir(path, { recursive: true });
    return path;
  }
}
