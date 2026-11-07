// Phrases de la connexion à Bosco : le flux en direct coupé dans le navigateur, puis rétabli.
import { Given, When } from './fixtures.ts';

const EVENTS = '**/api/events';

Given('Bosco ne répond plus', async ({ page }) => {
  await page.route(EVENTS, (route) => route.abort('connectionrefused'));
});

When('Bosco répond de nouveau', async ({ page }) => {
  await page.unroute(EVENTS);
});
