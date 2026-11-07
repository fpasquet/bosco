// Dossiers de configuration de Claude Code présents sur le poste (~/.claude, ~/.claude-perso…), avec un aperçu tiré des
// seuls noms et dates des fichiers : aucune session n'est lue avant le choix des profils (CA-SESS-02).
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { ProfileFinder } from '../../application/ports.ts';
import type { ProfileCandidate } from '../../domain/profile-candidate.ts';

const PROFILE_FOLDER = /^\.claude(-[\w.-]+)?$/;

export class FileProfileFinder implements ProfileFinder {
  constructor(private readonly root: string) {}

  async findCandidates(): Promise<ProfileCandidate[]> {
    const entries = await readdir(this.root, { withFileTypes: true }).catch(() => []);
    const candidates: ProfileCandidate[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || !PROFILE_FOLDER.test(entry.name)) continue;
      const preview = await this.preview(join(this.root, entry.name));
      if (preview) candidates.push(preview);
    }
    return candidates.sort((a, b) => a.path.localeCompare(b.path));
  }

  private async preview(path: string): Promise<null | ProfileCandidate> {
    const projects = join(path, 'projects');
    const repositories = await readdir(projects, { withFileTypes: true }).catch(() => null);
    if (!repositories) return null;
    let lastSessionAt: Date | null = null;
    let repositoryCount = 0;
    for (const repository of repositories.filter((entry) => entry.isDirectory())) {
      repositoryCount += 1;
      const files = await readdir(join(projects, repository.name)).catch(() => []);
      for (const file of files.filter((name) => name.endsWith('.jsonl'))) {
        const info = await stat(join(projects, repository.name, file));
        if (!lastSessionAt || info.mtime > lastSessionAt) lastSessionAt = info.mtime;
      }
    }
    return { path, repositoryCount, lastSessionAt };
  }
}
