import { readdir, realpath, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { Folders } from '../../application/ports.ts';
import type { FolderEntry } from '../../domain/folder.ts';

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

  async list(path: string): Promise<FolderEntry[]> {
    const entries = await readdir(path, { withFileTypes: true }).catch(() => []);
    // Les dossiers cachés ne sont jamais ouverts : seuls les dossiers visibles sont inspectés
    const folders = entries.filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'));
    return Promise.all(
      folders.map(async (entry) => {
        const git = await hasGit(join(path, entry.name));
        return { directory: true, git, name: entry.name };
      }),
    );
  }

  async realPath(path: string): Promise<null | string> {
    return realpath(path).catch(() => null);
  }
}
