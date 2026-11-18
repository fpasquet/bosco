// Phrases de la version et des mises à jour : les releases de GitHub et la version qui tourne, scriptées.
import { publishReleases, runVersion } from '../../shared/about.ts';
import { Given } from './fixtures.ts';

Given('GitHub publie les versions 0.2.0, 0.3.0 et 0.4.0-beta.1', async ({ bosco }) => {
  await publishReleases(bosco);
});

Given(
  'Bosco est passé de la version {texte} à la version {texte}',
  async ({ bosco }, previous: string, version: string) => {
    await runVersion(bosco, { previous, version });
  },
);
