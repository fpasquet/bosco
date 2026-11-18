// Phrases de l'accès d'un profil à son abonnement : le fichier d'un jeton longue durée, déclaré dans ses réglages. Les
// jetons des scénarios sont faux, rangés dans le dossier temporaire du scénario.
import { join } from 'node:path';
import { sourceIdOf } from '../../shared/hooks.ts';
import { writeTokenFile } from '../../shared/token.ts';
import { Given, When } from './fixtures.ts';

Given('the folder {string} has a long-lived token in the file {string}', ({ bosco }, folder: string, file: string) => {
  writeTokenFile(bosco.profilesRoot, folder, file);
});

Given('the folder {string} has an empty file {string}', ({ bosco }, folder: string, file: string) => {
  writeTokenFile(bosco.profilesRoot, folder, file, '');
});

When(
  'I declare the file {string} as the long-lived token of the profile {string}',
  async ({ bosco, last, request }, file: string, profile: string) => {
    const id = await sourceIdOf(bosco.url, profile);
    const response = await request.put(`/api/sources/${id}/token`, {
      data: { path: join(bosco.profilesRoot, file) },
    });
    last.response = { status: response.status(), body: (await response.json()) as unknown };
  },
);

When('I remove the long-lived token of the profile {string}', async ({ bosco, last, request }, profile: string) => {
  const id = await sourceIdOf(bosco.url, profile);
  const response = await request.put(`/api/sources/${id}/token`, { data: { path: null } });
  last.response = { status: response.status(), body: (await response.json()) as unknown };
});
