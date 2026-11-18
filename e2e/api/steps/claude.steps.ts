// Phrases Claude Code : des profils et des transcripts écrits comme le fait Claude Code, dans le dossier du scénario.
import { expect } from '@playwright/test';
import { copyFileSync, existsSync, mkdirSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { TRANSCRIPTS } from '../../shared/transcripts.ts';

/** Fichiers des services de test des projets des scénarios (E12a). */
const COMPOSE = join(import.meta.dirname, '../../shared/compose');
import { Given, Then } from './fixtures.ts';

const written = new Map<string, string>();

Given(
  'the Claude Code profile {string} has the transcript {string} for the session {string}',
  ({ bosco }, profile: string, fixture: string, sessionId: string) => {
    written.set(sessionId, bosco.writeProfileTranscript(profile, join(TRANSCRIPTS, fixture), sessionId));
  },
);

Given(
  'the transcript of the session {string} was last modified {int} days ago',
  ({}, sessionId: string, days: number) => {
    const file = written.get(sessionId);
    if (!file) throw new Error(`No transcript written for the session ${sessionId}`);
    const at = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    utimesSync(file, at, at);
  },
);

Given('Claude Code erased the transcript of the session {string}', ({}, sessionId: string) => {
  const file = written.get(sessionId);
  if (!file) throw new Error(`No transcript written for the session ${sessionId}`);
  rmSync(file);
});

Given('the project {string} has the test services file {string}', ({ bosco }, project: string, fixture: string) => {
  copyFileSync(join(COMPOSE, fixture), join(bosco.profilesRoot, project, 'compose.yaml'));
});

Given(
  'the Claude Code profile {string} has an access to the Claude subscription of {string}',
  ({ bosco }, profile: string, email: string) => {
    const dir = join(bosco.profilesRoot, profile);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, '.credentials.json'), '{}');
    writeFileSync(join(dir, '.claude.json'), JSON.stringify({ oauthAccount: { emailAddress: email } }));
  },
);

Given('the workstation has the npm settings {string}', ({ bosco }, fixture: string) => {
  copyFileSync(join(import.meta.dirname, '../../shared/npm', fixture), join(bosco.profilesRoot, '.npmrc'));
});

/** Temps laissé à Bosco pour lire un transcript qu'il ne doit pas lire : il le lit d'ordinaire en moins d'une seconde. */
const NOT_READ_MS = 1500;

Then('Bosco should mark the profile {string} to update', async ({ bosco }, profile: string) => {
  const unreadable = async () => {
    const response = await fetch(`${bosco.url}/api/sources`);
    const body = (await response.json()) as { sources: { path: string; unreadable: boolean }[] };
    return body.sources.find(({ path }) => path.endsWith(`/${profile}`))?.unreadable;
  };
  await expect.poll(unreadable).toBe(true);
});

Then('Bosco should not read the session {string}', async ({ bosco }, sessionId: string) => {
  await new Promise((resolve) => setTimeout(resolve, NOT_READ_MS));
  const response = await fetch(`${bosco.url}/api/sessions/${sessionId}`);
  expect(response.status).toBe(404);
});

/** Délai laissé à une lecture en arrière-plan (tout l'historique) pour atteindre une session. */
const READ_MS = 10_000;

Then('Bosco should read the session {string}', async ({ bosco }, sessionId: string) => {
  await expect
    .poll(async () => (await fetch(`${bosco.url}/api/sessions/${sessionId}`)).status, { timeout: READ_MS })
    .toBe(200);
});

Then('the transcript of the session {string} should still be in its profile', ({}, sessionId: string) => {
  const file = written.get(sessionId);
  if (!file) throw new Error(`No transcript written for the session ${sessionId}`);
  expect(existsSync(file)).toBe(true);
});
