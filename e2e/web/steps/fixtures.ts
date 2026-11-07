import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createBdd } from 'playwright-bdd';
import { boscoTest } from '../../shared/fixtures.ts';
import { RECORDINGS } from '../paths.ts';

// Le web n'appelle aucun service extérieur côté serveur : le dossier d'enregistrements reste vide et tout appel sortant échoue.
export const test = boscoTest(join(RECORDINGS, 'server')).extend<
  { pending: { hook?: Promise<unknown> } },
  { replayUsed: Set<string> }
>({
  // Enregistrements rejoués par le navigateur dans ce processus, réunis pour le mode clean
  replayUsed: [
    async ({}, use, workerInfo) => {
      const used = new Set<string>();
      await use(used);
      const reportDir = process.env.BOSCO_REPLAY_REPORT;
      if (reportDir)
        writeFileSync(join(reportDir, `browser-${workerInfo.workerIndex}.json`), JSON.stringify([...used]));
    },
    { scope: 'worker' },
  ],
  // Réponse attendue par le hook de Claude Code, tant que la demande n'est pas tranchée

  pending: async ({}, use) => {
    await use({});
  },
});

export const { Given, When, Then } = createBdd(test);
