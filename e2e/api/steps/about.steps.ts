// Phrases de la version et des mises à jour : les releases de GitHub et la version qui tourne, scriptées.
import { failReleases, publishReleases, runVersion } from '../../shared/about.ts';
import { Given } from './fixtures.ts';

Given('GitHub publishes the releases 0.2.0, 0.3.0 and 0.4.0-beta.1', async ({ bosco }) => {
  await publishReleases(bosco);
});

Given('GitHub does not answer', async ({ bosco }) => {
  await failReleases(bosco);
});

Given('Bosco was updated from {string} to {string}', async ({ bosco }, previous: string, version: string) => {
  await runVersion(bosco, { previous, version });
});

Given(
  'Bosco runs the version {string} built from the commit {string}',
  async ({ bosco }, version: string, commit: string) => {
    await runVersion(bosco, { commit, version });
  },
);
