// Socle commun aux deux suites : une instance de Bosco par processus, remise à zéro avant chaque scénario.
import { test as base } from 'playwright-bdd';
import { type Bosco, startBosco } from './bosco.ts';

export function boscoTest(recordings: string) {
  return base.extend<{ resetBosco: void }, { bosco: Bosco }>({
    bosco: [
      async ({}, use) => {
        const bosco = await startBosco(recordings);
        await use(bosco);
        await bosco.stop();
      },
      { scope: 'worker' },
    ],
    baseURL: async ({ bosco }, use) => {
      await use(bosco.url);
    },
    resetBosco: [
      async ({ bosco }, use) => {
        await bosco.reset();
        await use();
      },
      { auto: true },
    ],
  });
}
