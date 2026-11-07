// Scénarios de l'API : techniques, en anglais (langue par défaut de Gherkin), sans navigateur.
import { defineConfig } from '@playwright/test';
import { cucumberReporter, defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({ features: 'features/**/*.feature', steps: 'steps/**/*.ts' });

export default defineConfig({
  testDir,
  globalSetup: './global-setup.ts',
  // Captures rangées à côté des features (le dossier généré par bddgen n'est pas versionné), sans suffixe de plateforme
  snapshotPathTemplate: '{testFileDir}/__snapshots__/{testFileName}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], cucumberReporter('html', { outputFile: 'reports/cucumber.html' })],
});
