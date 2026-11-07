// Parcours du web : en français (en-tête « # language: fr » de chaque fichier), sur ordinateur et sur téléphone.
import { defineConfig, devices } from '@playwright/test';
import { cucumberReporter, defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({ features: 'features/**/*.feature', steps: 'steps/**/*.ts' });

export default defineConfig({
  testDir,
  globalSetup: './global-setup.ts',
  snapshotPathTemplate: '{testFileDir}/__snapshots__/{testFileName}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], cucumberReporter('html', { outputFile: 'reports/cucumber.html' })],
  use: { locale: 'fr-FR', timezoneId: 'Europe/Paris', reducedMotion: 'reduce', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, grepInvert: /@mobile/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
  ],
});
