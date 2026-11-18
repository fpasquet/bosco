// Phrases du retrait d'une source : la source visée par son profil, son identifiant changeant à chaque scénario.
import { sourceIdOf } from '../../shared/hooks.ts';
import { When } from './fixtures.ts';

When(
  'I read what removing the source of the profile {string} would change',
  async ({ bosco, last, request }, profile: string) => {
    const id = await sourceIdOf(bosco.url, profile);
    const response = await request.get(`/api/sources/${id}/removal`);
    last.response = { status: response.status(), body: (await response.json()) as unknown };
  },
);

When('I remove the source of the profile {string}', async ({ bosco, last, request }, profile: string) => {
  const id = await sourceIdOf(bosco.url, profile);
  const response = await request.delete(`/api/sources/${id}`);
  const text = await response.text();
  last.response = { status: response.status(), body: text ? (JSON.parse(text) as unknown) : null };
});
