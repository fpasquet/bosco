// Mode clean : chaque processus note les enregistrements qu'il a utilisés ; à la fin de la suite, on supprime les autres.
import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cleanUnused } from '../replay/replay.ts';

/** Global setup d'une suite : `dir` est son dossier d'enregistrements, `prefix` le préfixe des rapports qui le concernent. */
export function replayClean(dir: string, prefix: string): () => (() => void) | undefined {
  return () => {
    if (process.env.BOSCO_REPLAY !== 'clean') return undefined;
    const reportDir = mkdtempSync(join(tmpdir(), 'bosco-replay-'));
    process.env.BOSCO_REPLAY_REPORT = reportDir;
    return () => {
      const used = readdirSync(reportDir)
        .filter((file) => file.startsWith(prefix))
        .flatMap((file) => JSON.parse(readFileSync(join(reportDir, file), 'utf8')) as string[]);
      const removed = cleanUnused(dir, used);
      const list = removed.length ? `: ${removed.join(', ')}` : '';
      console.log(`replay clean: ${removed.length} unused recording(s) removed${list}`);
    };
  };
}
