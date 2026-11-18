// Dossiers de configuration de Claude Code présents sur le poste (~/.claude, ~/.claude-perso…), avec un aperçu tiré des
// seuls noms et dates des fichiers : aucune session n'est lue avant le choix des profils.
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

  /** Un dossier ajouté à la main : il a des sessions (projects/) ou des réglages de Claude Code. */
  async inspect(path: string): Promise<null | ProfileCandidate> {
    const preview = await this.preview(path);
    if (preview) return preview;
    const markers = await Promise.all(
      ['settings.json', '.credentials.json'].map((file) =>
        stat(join(path, file)).then(
          (info) => info.isFile(),
          () => false,
        ),
      ),
    );
    return markers.some(Boolean) ? { path, projectCount: 0, lastSessionAt: null } : null;
  }

  private async preview(path: string): Promise<null | ProfileCandidate> {
    const projects = join(path, 'projects');
    const folders = await readdir(projects, { withFileTypes: true }).catch(() => null);
    if (!folders) return null;
    let lastSessionAt: Date | null = null;
    let projectCount = 0;
    for (const folder of folders.filter((entry) => entry.isDirectory())) {
      projectCount += 1;
      const files = await readdir(join(projects, folder.name)).catch(() => []);
      for (const file of files.filter((name) => name.endsWith('.jsonl'))) {
        const info = await stat(join(projects, folder.name, file));
        if (!lastSessionAt || info.mtime > lastSessionAt) lastSessionAt = info.mtime;
      }
    }
    return { path, projectCount, lastSessionAt };
  }
}
