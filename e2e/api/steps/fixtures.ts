import { createBdd } from 'playwright-bdd';
import type { StreamEvent } from '../../shared/bosco.ts';
import { boscoTest } from '../../shared/fixtures.ts';
import { RECORDINGS } from '../paths.ts';

export interface ApiResponse {
  status: number;
  body: unknown;
}

export const test = boscoTest(RECORDINGS).extend<{
  events: StreamEvent[];
  last: { response?: ApiResponse; pending?: Promise<ApiResponse> };
}>({
  // Chaque scénario écoute le flux d'événements dès le début
  events: [
    async ({ bosco, resetBosco: _ }, use) => {
      const stream = bosco.subscribe();
      await use(stream.events);
      stream.close();
    },
    { auto: true },
  ],

  last: async ({}, use) => {
    await use({});
  },
});

export const { Given, When, Then } = createBdd(test);
