// node --import @bosco/replay/register : branche le module sur le fetch natif du processus testé.
// À l'arrêt, écrit la liste des enregistrements utilisés dans BOSCO_REPLAY_REPORT (réunis pour le mode clean).
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { installReplay, type ReplayMode } from './replay.ts';

const mode = process.env.BOSCO_REPLAY as ReplayMode | undefined;
const dir = process.env.BOSCO_RECORDINGS;
if (mode && dir) {
  const replay = installReplay({ mode, dir, secrets: [process.env.GITHUB_TOKEN ?? ''] });
  (globalThis as { boscoReplayReset?: () => void }).boscoReplayReset = () => replay.reset();
  const report = (): void => {
    const reportDir = process.env.BOSCO_REPLAY_REPORT;
    if (reportDir) writeFileSync(join(reportDir, `server-${process.pid}.json`), JSON.stringify(replay.used()));
  };
  process.once('SIGTERM', () => {
    report();
    process.exit(0);
  });
  process.once('beforeExit', report);
}
