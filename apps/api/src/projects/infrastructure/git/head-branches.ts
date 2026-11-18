import { readFile, stat } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import type { Branches } from '../../application/ports.ts';

const BRANCH_REF = 'ref: refs/heads/';

/** Dossier git d'un dépôt : `.git`, ou celui que désigne le fichier `.git` d'un worktree. */
async function gitDirOf(path: string): Promise<null | string> {
  const marker = join(path, '.git');
  try {
    const found = await stat(marker);
    if (found.isDirectory()) return marker;
    const content = await readFile(marker, 'utf8');
    const line = content.split('\n').find((candidate) => candidate.startsWith('gitdir:'));
    const pointer = line?.slice('gitdir:'.length).trim();
    if (!pointer) return null;
    return isAbsolute(pointer) ? pointer : resolve(path, pointer);
  } catch {
    return null;
  }
}

/** Branche courante d'un dépôt, lue dans son fichier HEAD : aucun processus git, rien d'écrit. */
export class HeadBranches implements Branches {
  async currentOf(path: string): Promise<null | string> {
    const dir = await gitDirOf(path);
    if (!dir) return null;
    const head = await readFile(join(dir, 'HEAD'), 'utf8').catch(() => '');
    const ref = head.trim();
    // Un commit détaché n'a pas de branche
    return ref.startsWith(BRANCH_REF) ? ref.slice(BRANCH_REF.length) || null : null;
  }
}
