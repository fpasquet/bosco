import { readFileSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';

/**
 * Dépôt d'origine d'un worktree git (CA-SESS-78). Le `.git` d'un worktree est un fichier qui pointe vers
 * `<origine>/.git/worktrees/<nom>` ; celui d'un dépôt ordinaire est un dossier. Lu une fois par racine : l'affichage
 * d'une session reste synchrone (DT-27).
 */
export class GitWorktreeOrigins {
  private readonly known = new Map<string, null | string>();
  private readonly roots = new Map<string, null | string>();

  originOf(root: string): null | string {
    if (!this.known.has(root)) this.known.set(root, readOrigin(root));
    return this.known.get(root) ?? null;
  }

  /** Racine git d'un dossier (celui qui contient .git), pour une session lue avant que Bosco la note. */
  rootOf(path: string): null | string {
    if (!this.roots.has(path)) this.roots.set(path, findRoot(path));
    return this.roots.get(path) ?? null;
  }
}

function findRoot(path: string): null | string {
  for (let dir = path; dir !== dirname(dir); dir = dirname(dir)) {
    try {
      statSync(join(dir, '.git'));
      return dir;
    } catch {
      // pas de .git ici : le dossier parent
    }
  }
  return null;
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
