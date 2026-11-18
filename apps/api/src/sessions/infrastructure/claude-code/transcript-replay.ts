import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { TranscriptReplay } from '../../application/ports.ts';
import type { TranscriptEvent } from '../../domain/transcript-event.ts';
import { TranscriptParser } from './transcript-parser.ts';

/** Relit tout le transcript d'une session (<profil>/projects/<dossier>/<session>.jsonl), sans le modifier. */
export class FileTranscriptReplay implements TranscriptReplay {
  async read(profile: string, sessionId: string): Promise<null | TranscriptEvent[]> {
    const projects = join(profile, 'projects');
    const folders = await readdir(projects, { withFileTypes: true }).catch(() => []);
    for (const folder of folders.filter((entry) => entry.isDirectory())) {
      const text = await readFile(join(projects, folder.name, `${sessionId}.jsonl`), 'utf8').catch(() => null);
      if (text === null) continue;
      const parser = new TranscriptParser();
      return text
        .split('\n')
        .flatMap((line) => parser.parse(line))
        .filter((parsed) => parsed.sessionId === sessionId)
        .map(({ event }) => event);
    }
    return null;
  }
}
