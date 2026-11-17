import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { Folders } from '../../application/ports.ts';

async function hasGit(path: string): Promise<boolean> {
  try {
    // Un dépôt a un dossier .git ; un worktree ou un sous-module, un fichier .git
    await stat(join(path, '.git'));
    return true;
  } catch {
    return false;
  }
}

/** Dossiers du poste, lus sans rien modifier : des noms et la présence d'un .git, jamais le contenu des fichiers. */
export class DiskFolders implements Folders {
  async inspect(path: string): Promise<null | { git: boolean }> {
    try {
      const found = await stat(path);
      if (!found.isDirectory()) return null;
    } catch {
      return null;
    }
    const git = await hasGit(path);
    return { git };
  }
}
