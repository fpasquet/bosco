import { readdir, readFile, realpath, stat } from 'node:fs/promises';
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

/** Fichiers qui font d'un dossier un monodépôt, quel que soit leur contenu. */
const WORKSPACE_FILES = ['pnpm-workspace.yaml', 'turbo.json', 'nx.json'];

async function exists(path: string): Promise<boolean> {
  return stat(path).then(
    (found) => found.isFile(),
    () => false,
  );
}

/** Les espaces de travail de npm, de Yarn ou de Bun se déclarent dans le package.json : seule cette clé est lue. */
async function declaresWorkspaces(path: string): Promise<boolean> {
  try {
    const content = await readFile(join(path, 'package.json'), 'utf8');
    const manifest = JSON.parse(content) as { workspaces?: unknown };
    return (
      Array.isArray(manifest.workspaces) || (typeof manifest.workspaces === 'object' && manifest.workspaces !== null)
    );
  } catch {
    return false;
  }
}

/**
 * Dossiers du poste, lus sans rien modifier : des noms et la présence d'un .git, jamais le contenu des fichiers, sauf
 * les espaces de travail d'un package.json.
 */
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

  async isMonorepo(path: string): Promise<boolean> {
    const markers = await Promise.all(WORKSPACE_FILES.map((file) => exists(join(path, file))));
    if (markers.some(Boolean)) return true;
    return declaresWorkspaces(path);
  }

  async list(path: string): Promise<FolderEntry[]> {
    const entries = await readdir(path, { withFileTypes: true }).catch(() => []);
    // Les dossiers cachés se listent aussi : le domaine décide de les montrer (dossiers de configuration de Claude Code)
    const folders = entries.filter((entry) => entry.isDirectory());
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
