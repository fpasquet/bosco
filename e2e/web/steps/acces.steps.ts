// Phrases de l'accès d'un profil à son abonnement : un faux jeton longue durée rangé dans le dossier du scénario, et
// les profils sans accès, grisés dans le choix de l'abonnement d'une nouvelle session.
import { expect } from '@playwright/test';
import { writeTokenFile } from '../../shared/token.ts';
import { Given, Then } from './fixtures.ts';

Given(
  'le dossier {texte} contient un jeton longue durée dans le fichier {texte}',
  ({ bosco }, folder: string, file: string) => {
    writeTokenFile(bosco.profilesRoot, folder, file);
  },
);

Then('le choix {texte} de la liste {texte} est grisé', async ({ page }, option: string, label: string) => {
  await expect(page.getByLabel(label).locator('option', { hasText: option })).toBeDisabled();
});

Then('la fenêtre est fermée', async ({ page }) => {
  await expect(page.getByRole('dialog')).toBeHidden();
});
