import { readFileSync, statSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';

/**
 * Dépôt d'origine d'un worktree git (CA-SESS-78). Le `.git` d'un worktree est un fichier qui pointe vers
 * `<origine>/.git/worktrees/<nom>` ; celui d'un dépôt ordinaire est un dossier. Lu une fois par racine : l'affichage
 * d'une session reste synchrone (DT-27).
 */
export class GitWorktreeOrigins {
  private readonly known = new Map<string, null | string>();

  originOf(root: string): null | string {
    if (!this.known.has(root)) this.known.set(root, readOrigin(root));
    return this.known.get(root) ?? null;
  }
}

function readOrigin(root: string): null | string {
  const marker = join(root, '.git');
  try {
    if (!statSync(marker).isFile()) return null;
    const line = readFileSync(marker, 'utf8')
      .split('\n')
      .find((candidate) => candidate.startsWith('gitdir:'));
    const gitdir = line?.slice('gitdir:'.length).trim();
    if (!gitdir) return null;
    const target = isAbsolute(gitdir) ? gitdir : resolve(root, gitdir);
    // Un sous-module pointe vers .git/modules/… : ce n'est pas un worktree, il reste un dépôt à part
    const index = target.lastIndexOf('/.git/worktrees/');
    return index > 0 ? target.slice(0, index) : null;
  } catch {
    return null;
  }
}
