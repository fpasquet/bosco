// Présence du transcript d'une session dans son profil (<profil>/projects/<dossier>/<session>.jsonl), sans le lire :
// Claude Code efface les anciennes sessions, qui ne se reprennent plus.
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { TranscriptFiles } from '../../application/ports.ts';

export class FileTranscriptFiles implements TranscriptFiles {
  async exists(profile: string, sessionId: string): Promise<boolean> {
    const projects = join(profile, 'projects');
    const folders = await readdir(projects, { withFileTypes: true }).catch(() => []);
    for (const folder of folders.filter((entry) => entry.isDirectory())) {
      const found = await stat(join(projects, folder.name, `${sessionId}.jsonl`)).then(
        (info) => info.isFile(),
        () => false,
      );
      if (found) return true;
    }
    return false;
  }
}
